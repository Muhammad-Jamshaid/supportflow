"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ticketWhere } from "@/lib/ticket-rbac";
import { revalidatePath } from "next/cache";

// ─────────────────────────────────────────────────────────────────────────────
// CREATE REPLY (authenticated)
// RBAC: verifies the calling user can access this ticket before writing the reply.
// CUSTOMER: can only reply to their own tickets (customerId === session.user.id)
// AGENT / ADMIN: can reply to any company ticket
// ─────────────────────────────────────────────────────────────────────────────
export async function createReplyAction(formData: FormData): Promise<{
  ok?: true;
  error?: string;
}> {
  const session = await getServerSession(authOptions);
  if (!session) return { error: "You must be signed in to reply." };

  const ticketId = (formData.get("ticketId") as string | null)?.trim();
  const message  = (formData.get("message")  as string | null)?.trim();

  if (!ticketId || !message) return { error: "Reply cannot be empty." };

  // ── RBAC ticket access check ──────────────────────────────────────────────
  // CUSTOMER where clause:  { id, companyId, customerId: session.user.id }
  // AGENT/ADMIN where clause: { id, companyId }
  const ticket = await prisma.ticket.findFirst({
    where: {
      id: ticketId,
      ...ticketWhere(session),   // ← RBAC applied here
    },
  });
  if (!ticket) return { error: "Ticket not found or access denied." };

  await prisma.reply.create({
    data: {
      message,
      ticketId,
      userId:    session.user.id,
      companyId: session.user.companyId,
    },
  });

  await prisma.activityLog.create({
    data: {
      action:    "reply.added",
      targetId:  ticketId,
      companyId: session.user.companyId,
      userId:    session.user.id,
    },
  });

  // Create Notifications
  if (session.user.role === "CUSTOMER") {
    // Customer replied -> Notify assigned agent (if any)
    // In a real app we might notify all admins if unassigned, but for now we'll just notify the assigned agent
    if (ticket.assignedAgentId) {
      await prisma.notification.create({
        data: {
          userId: ticket.assignedAgentId,
          title: "New Customer Reply",
          message: `Ticket: ${ticket.subject}`,
          link: `/tickets/${ticket.id}`,
        }
      });
    }
  } else {
    // Agent/Admin replied -> Notify customer
    await prisma.notification.create({
      data: {
        userId: ticket.customerId,
        title: "New Reply from Support",
        message: `Ticket: ${ticket.subject}`,
        link: `/tickets/${ticket.id}`,
      }
    });
  }

  revalidatePath(`/tickets/${ticketId}`);
  return { ok: true };
}

// ─────────────────────────────────────────────────────────────────────────────
// CHANGE TICKET STATUS (AGENT / ADMIN only)
// CUSTOMER role is explicitly blocked — they cannot change ticket status.
// ─────────────────────────────────────────────────────────────────────────────
export async function changeStatusAction(formData: FormData): Promise<{
  ok?: true;
  error?: string;
}> {
  const session = await getServerSession(authOptions);
  if (!session) return { error: "Unauthorized." };
  if (session.user.role === "CUSTOMER") return { error: "Forbidden." };

  const ticketId  = (formData.get("ticketId")  as string | null)?.trim();
  const newStatus = (formData.get("newStatus") as string | null)?.trim();

  if (!ticketId || !newStatus) return { error: "Missing parameters." };
  if (!["OPEN", "RESOLVED", "CLOSED"].includes(newStatus)) {
    return { error: "Invalid status value." };
  }

  const ticket = await prisma.ticket.findFirst({
    where: { id: ticketId, companyId: session.user.companyId },
  });
  if (!ticket) return { error: "Ticket not found." };

  await prisma.ticket.update({
    where: { id: ticketId },
    data:  { status: newStatus as "OPEN" | "RESOLVED" | "CLOSED" },
  });

  await prisma.activityLog.create({
    data: {
      action:    "ticket.status_changed",
      targetId:  ticketId,
      companyId: session.user.companyId,
      userId:    session.user.id,
    },
  });

  revalidatePath(`/tickets/${ticketId}`);
  return { ok: true };
}

// ─────────────────────────────────────────────────────────────────────────────
// ARCHIVE TICKET (ADMIN / AGENT only)
// Soft-delete: sets archived = true. Never deletes from the DB.
// CUSTOMER role is explicitly blocked.
// ─────────────────────────────────────────────────────────────────────────────
export async function archiveTicketAction(formData: FormData): Promise<{
  ok?: true;
  error?: string;
}> {
  const session = await getServerSession(authOptions);
  if (!session) return { error: "Unauthorized." };
  if (session.user.role === "CUSTOMER") return { error: "Forbidden." };

  const ticketId = (formData.get("ticketId") as string | null)?.trim();
  if (!ticketId) return { error: "Missing ticketId." };

  // RBAC: ticket must exist within the caller's company
  const ticket = await prisma.ticket.findFirst({
    where: { id: ticketId, companyId: session.user.companyId },
  });
  if (!ticket) return { error: "Ticket not found." };
  if (ticket.archived) return { error: "Ticket is already archived." };

  // Soft-delete — status stays unchanged (archive ⊥ workflow state)
  await prisma.ticket.update({
    where: { id: ticketId },
    data:  { archived: true },
  });

  await prisma.activityLog.create({
    data: {
      action:    "ticket.archived",
      targetId:  ticketId,
      companyId: session.user.companyId,
      userId:    session.user.id,
    },
  });

  revalidatePath("/tickets");
  revalidatePath(`/tickets/${ticketId}`);
  return { ok: true };
}

// ─────────────────────────────────────────────────────────────────────────────
// CREATE TICKET (AGENT / ADMIN only)
// Allows agents/admins to create tickets on behalf of their customers.
// CUSTOMER role is explicitly blocked (they use the public submit portal).
// ─────────────────────────────────────────────────────────────────────────────
export async function createAgentTicketAction(formData: FormData): Promise<{
  ok?: true;
  ticketId?: string;
  error?: string;
}> {
  const session = await getServerSession(authOptions);
  if (!session) return { error: "Unauthorized." };
  if (session.user.role === "CUSTOMER") return { error: "Forbidden." };

  const subject    = (formData.get("subject")    as string | null)?.trim();
  const customerId = (formData.get("customerId") as string | null)?.trim();
  const priority   = (formData.get("priority")   as string | null)?.trim();
  const message    = (formData.get("message")    as string | null)?.trim();

  if (!subject || !customerId || !priority || !message) {
    return { error: "All fields are required." };
  }

  if (!["LOW", "NORMAL", "HIGH", "URGENT"].includes(priority)) {
    return { error: "Invalid priority." };
  }

  // RBAC: Ensure the customer belongs to the agent's company
  const customer = await prisma.user.findFirst({
    where: { id: customerId, companyId: session.user.companyId, role: "CUSTOMER" },
  });
  if (!customer) {
    return { error: "Invalid customer selected or customer does not belong to your company." };
  }

  const { checkTicketLimit } = await import("@/lib/billing");
  const limitError = await checkTicketLimit(session.user.companyId);
  if (limitError) {
    return { error: limitError };
  }

  const ticket = await prisma.ticket.create({
    data: {
      subject,
      description: message,
      priority: priority as "LOW" | "NORMAL" | "HIGH" | "URGENT",
      status: "OPEN",
      companyId: session.user.companyId,
      customerId,
      assignedAgentId: session.user.id, // Auto-assign to the creator
      replies: {
        create: {
          message,
          userId: session.user.id,
          companyId: session.user.companyId,
        }
      }
    }
  });

  await prisma.activityLog.create({
    data: {
      action: "ticket.created",
      targetId: ticket.id,
      companyId: session.user.companyId,
      userId: session.user.id,
    },
  });

  revalidatePath("/tickets");
  return { ok: true, ticketId: ticket.id };
}
