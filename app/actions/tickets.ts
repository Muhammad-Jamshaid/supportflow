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
