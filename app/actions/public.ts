"use server";

import { prisma } from "@/lib/prisma";
import { waitUntil } from "@vercel/functions";
import { triageTicket } from "@/lib/ai";

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC TICKET SUBMISSION (no auth required)
// Called from /submit-ticket page.
// Finds or creates a CUSTOMER user for the given email + companyId, then
// creates the Ticket and an ActivityLog entry.
// Returns { ticketId } on success or { error } on failure — no redirect,
// so the client component handles navigation.
// ─────────────────────────────────────────────────────────────────────────────
export async function submitTicketAction(formData: FormData): Promise<{
  ticketId?: string;
  trackingToken?: string;
  error?: string;
}> {
  const companyId   = (formData.get("companyId")   as string | null)?.trim();
  const subject     = (formData.get("subject")      as string | null)?.trim();
  const description = (formData.get("description")  as string | null)?.trim();
  const name        = (formData.get("name")         as string | null)?.trim();
  const email       = (formData.get("email")        as string | null)?.trim().toLowerCase();

  if (!companyId || !subject || !description || !email) {
    return { error: "Subject, description, and email are required." };
  }
  if (subject.length > 200) {
    return { error: "Subject must be 200 characters or fewer." };
  }

  // We don't need a separate round-trip to verify the company exists
  // because the user lookup/creation will enforce the foreign key constraint.

  // Find or create CUSTOMER user for this email + company combination
  let customer = await prisma.user.findFirst({
    where: { email, companyId },
  });

  if (!customer) {
    customer = await prisma.user.create({
      data: { email, name: name || null, role: "CUSTOMER", companyId },
    });
  } else if (name && !customer.name) {
    // Fire-and-forget name backfill to save a round trip
    prisma.user.update({ where: { id: customer.id }, data: { name } }).catch(console.error);
  }

  const { checkTicketLimit } = await import("@/lib/billing");
  const limitError = await checkTicketLimit(companyId);
  if (limitError) {
    return { error: limitError };
  }

  const ticket = await prisma.ticket.create({
    data: {
      subject,
      description,
      status: "OPEN",
      priority: "NORMAL",
      companyId,
      customerId: customer.id,
    },
  });

  // Notify admins and agents
  const agents = await prisma.user.findMany({
    where: {
      companyId,
      role: { in: ["ADMIN", "AGENT"] },
    }
  });

  if (agents.length > 0) {
    await prisma.notification.createMany({
      data: agents.map(agent => ({
        userId: agent.id,
        title: "New Support Ticket",
        message: `Ticket: ${subject}`,
        link: `/tickets/${ticket.id}`,
      })),
    });
  }

  // Activity log in the background (fire-and-forget) to speed up response
  prisma.activityLog.create({
    data: {
      action: "ticket.created",
      targetId: ticket.id,
      companyId,
      userId: customer.id,
    },
  }).catch(console.error);

  // Trigger AI Triage in the background
  // Vercel requires waitUntil() to keep the lambda alive after response,
  // but locally waitUntil() holds the HTTP socket open. We split the behavior:
  if (process.env.NODE_ENV === "development") {
    triageTicket(ticket.id, ticket.subject, ticket.description).catch(console.error);
  } else {
    waitUntil(triageTicket(ticket.id, ticket.subject, ticket.description));
  }

  return { ticketId: ticket.id, trackingToken: ticket.trackingToken };
}

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC TICKET REPLY (no auth required)
// Called from /track/[trackingToken] page.
// Finds the ticket by trackingToken, creates a reply, and logs the activity.
// ─────────────────────────────────────────────────────────────────────────────
export async function submitPublicReplyAction(formData: FormData): Promise<{
  error?: string;
  success?: boolean;
}> {
  const trackingToken = (formData.get("trackingToken") as string | null)?.trim();
  const message       = (formData.get("message") as string | null)?.trim();

  if (!trackingToken || !message) {
    return { error: "Message is required." };
  }

  const ticket = await prisma.ticket.findUnique({
    where: { trackingToken },
  });

  if (!ticket) {
    return { error: "Ticket not found or link is invalid." };
  }

  // Create the reply acting as the customer who owns the ticket
  await prisma.reply.create({
    data: {
      message,
      ticketId: ticket.id,
      companyId: ticket.companyId,
      userId: ticket.customerId,
    },
  });

  // Activity log
  await prisma.activityLog.create({
    data: {
      action:   "reply.added",
      targetId: ticket.id,
      companyId: ticket.companyId,
      userId:   ticket.customerId,
    },
  });

  // Notifications
  let notificationRecipients: string[] = [];
  
  if (ticket.assignedAgentId) {
    notificationRecipients = [ticket.assignedAgentId];
  } else {
    const agents = await prisma.user.findMany({
      where: {
        companyId: ticket.companyId,
        role: { in: ["ADMIN", "AGENT"] },
      }
    });
    notificationRecipients = agents.map(a => a.id);
  }

  if (notificationRecipients.length > 0) {
    await prisma.notification.createMany({
      data: notificationRecipients.map(id => ({
        userId: id,
        title: "New Customer Reply",
        message: `Ticket: ${ticket.subject}`,
        link: `/tickets/${ticket.id}`,
      })),
    });
  }

  return { success: true };
}
