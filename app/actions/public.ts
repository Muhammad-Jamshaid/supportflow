"use server";

import { prisma } from "@/lib/prisma";

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

  const company = await prisma.company.findUnique({ where: { id: companyId } });
  if (!company) return { error: "Workspace not found." };

  // Find or create CUSTOMER user for this email + company combination
  let customer = await prisma.user.findFirst({
    where: { email, companyId },
  });

  if (!customer) {
    customer = await prisma.user.create({
      data: {
        email,
        name: name || null,
        role: "CUSTOMER",
        companyId,
      },
    });
  } else if (name && !customer.name) {
    // Backfill name if we now have one
    customer = await prisma.user.update({
      where: { id: customer.id },
      data: { name },
    });
  }

  // Create the ticket
  const ticket = await prisma.ticket.create({
    data: {
      subject,
      description,
      status:   "OPEN",
      priority: "NORMAL",
      companyId,
      customerId: customer.id,
    },
  });

  // Activity log
  await prisma.activityLog.create({
    data: {
      action:   "ticket.created",
      targetId: ticket.id,
      companyId,
      userId:   customer.id,
    },
  });

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

  return { success: true };
}
