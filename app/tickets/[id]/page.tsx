import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ticketWhere } from "@/lib/ticket-rbac";
import Link from "next/link";
import AppShell from "@/app/components/AppShell";
import Sidebar from "@/app/components/Sidebar";
import Pill, { priorityVariant, statusVariant } from "@/app/components/Pill";
import Avatar from "@/app/components/Avatar";
import DarkModeToggle from "@/app/components/DarkModeToggle";
import ReplyForm from "@/app/components/ReplyForm";
import StatusDropdown from "@/app/components/StatusDropdown";
import { archiveTicketAction } from "@/app/actions/tickets";

async function handleArchive(formData: FormData) {
  "use server";
  await archiveTicketAction(formData);
}

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

interface Props {
  params: { id: string };
}

export default async function TicketDetailPage({ params }: Props) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  // Apply RBAC: CUSTOMER can only see their own tickets, ADMIN/AGENT can see any in company
  const ticket = await prisma.ticket.findFirst({
    where: {
      id: params.id,
      ...ticketWhere(session, { includeArchived: true }),
    },
    include: {
      customer: { select: { name: true, email: true } },
      assignedAgent: { select: { name: true } },
      replies: {
        orderBy: { createdAt: "asc" },
        include: { user: { select: { name: true, role: true } } },
      },
    },
  });

  if (!ticket) notFound();

  // Fetch Activity Log for this ticket
  const activityLogs = await prisma.activityLog.findMany({
    where: {
      companyId: session.user.companyId,
      targetId: ticket.id,
    },
    orderBy: { createdAt: "desc" },
    include: { user: { select: { name: true } } },
  });

  const company = await prisma.company.findUnique({
    where: { id: session.user.companyId },
    select: { name: true, plan: true },
  });

  const ticketIdShort = `#${ticket.id.slice(-4).toUpperCase()}`;
  const isCustomer = session.user.role === "CUSTOMER";

  return (
    <AppShell
      sidebar={
        <Sidebar
          activePath="/tickets"
          userName={session.user.name}
          userRole={session.user.role}
          companyName={company?.name}
        />
      }
    >
      {/* Topbar */}
      <div className="topbar">
        <Link
          href="/tickets"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            fontSize: "14px",
            fontWeight: 500,
          }}
        >
          ← Back to tickets
        </Link>
        <div className="topbar-right">
          <DarkModeToggle />
          <Pill variant={statusVariant(ticket.status)}>
            {ticket.status.charAt(0) + ticket.status.slice(1).toLowerCase()}
          </Pill>
          <Pill variant={priorityVariant(ticket.priority)}>
            {ticket.priority.charAt(0) + ticket.priority.slice(1).toLowerCase()}
          </Pill>
          {!isCustomer && (
            <StatusDropdown ticketId={ticket.id} currentStatus={ticket.status} />
          )}
          {/* Archive — ADMIN / AGENT only, shown only when not already archived */}
          {!isCustomer && !ticket.archived && (
            <form action={handleArchive}>
              <input type="hidden" name="ticketId" value={ticket.id} />
              <button
                type="submit"
                className="btn btn-ghost btn-sm"
                id={`archive-ticket-${ticket.id}`}
                aria-label="Archive this ticket"
                style={{ color: "var(--text-muted)", fontSize: "12px" }}
              >
                Archive
              </button>
            </form>
          )}
          {!isCustomer && ticket.archived && (
            <span
              className="pill resolved"
              title="This ticket has been archived"
            >
              Archived
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="content">
        <div className="tdetail">
          {/* Thread */}
          <div className="thread">
            <div className="thead">
              <div>
                <h2>
                  {ticketIdShort} — {ticket.subject}
                </h2>
                <div className="tmeta">
                  Opened {new Date(ticket.createdAt).toLocaleDateString()} ·{" "}
                  {ticket.customer.name || ticket.customer.email}
                </div>
              </div>
            </div>

            <div className={`msg ${ticket.customerId === session.user.id ? "viewer" : ""}`}>
              <Avatar name={ticket.customer.name || "Customer"} />
              <div className="msg-body">
                <div className="msg-info">
                  <strong>{ticket.customer.name || "Customer"}</strong>
                  <span>{timeAgo(ticket.createdAt)}</span>
                </div>
                <div className="msg-content" style={{ whiteSpace: "pre-wrap" }}>
                  {ticket.description}
                </div>
              </div>
            </div>

            {ticket.replies.map((reply) => {
              const isViewer = reply.userId === session.user.id;
              const isAgentOrAdmin = reply.user.role === "AGENT" || reply.user.role === "ADMIN";
              return (
                <div key={reply.id} className={`msg ${isViewer ? "viewer" : ""}`}>
                  <Avatar name={reply.user.name || "User"} />
                  <div className="msg-body">
                    <div className="msg-info">
                      <strong>{reply.user.name || "User"}</strong>
                      {isAgentOrAdmin && <span className="agent-badge">Agent</span>}
                      <span>{timeAgo(reply.createdAt)}</span>
                    </div>
                    <div className="msg-content" style={{ whiteSpace: "pre-wrap" }}>
                      {reply.message}
                    </div>
                  </div>
                </div>
              );
            })}

          {/* Compose Reply */}
          <div style={{ padding: "16px", backgroundColor: "var(--surface)", borderBottom: "1px solid var(--border)", position: "relative", zIndex: 20 }}>
            <ReplyForm 
              ticketId={ticket.id} 
              aiSuggestedReply={session.user.role !== "CUSTOMER" ? ticket.aiSuggestedReply : undefined}
            />
          </div>

          {/* AI Triage Panel (Visible only to AGENT/ADMIN, and only if data exists) */}
          {session.user.role !== "CUSTOMER" && (ticket.aiSummary || ticket.aiCategory) && (
            <div style={{ padding: "16px", borderBottom: "1px solid var(--border)", backgroundColor: "var(--brand-soft)" }}>
              <h3 style={{ fontSize: "12px", fontWeight: 600, color: "var(--brand)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
                <svg style={{ width: "16px", height: "16px" }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                AI Triage
              </h3>
              
              {ticket.aiCategory && (
                <div style={{ marginBottom: "12px" }}>
                  <span style={{ fontSize: "12px", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>Predicted Category</span>
                  <Pill variant="brand">{ticket.aiCategory}</Pill>
                </div>
              )}
              
              {ticket.aiSummary && (
                <div>
                  <span style={{ fontSize: "12px", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>Auto-Summary</span>
                  <p style={{ fontSize: "14px", color: "var(--text)", fontStyle: "italic", margin: 0 }}>&quot;{ticket.aiSummary}&quot;</p>
                </div>
              )}
            </div>
          )}
          </div>

          {/* Sidebar */}
          <div className="tside">
            <div className="tside-sec">
              <h3>Details</h3>
              <div className="kv">
                <span className="k">Customer</span>
                <span>{ticket.customer.name || ticket.customer.email}</span>
              </div>
              <div className="kv">
                <span className="k">Status</span>
                <span>{ticket.status}</span>
              </div>
              <div className="kv">
                <span className="k">Priority</span>
                <span>{ticket.priority}</span>
              </div>
              {!isCustomer && (
                <div className="kv">
                  <span className="k">Assignee</span>
                  <span>{ticket.assignedAgent ? ticket.assignedAgent.name : "Unassigned"}</span>
                </div>
              )}
            </div>



            <div className="tside-sec activity">
              <h3>Activity Log</h3>
              {activityLogs.length === 0 && (
                <div style={{ fontSize: "13px", color: "var(--text-muted)" }}>No activity yet.</div>
              )}
              {activityLogs.map((log) => (
                <div key={log.id} className="aitem">
                  <div className="aitem-ico" />
                  <div className="aitem-txt">
                    <strong>{log.user.name || "System"}</strong>{" "}
                    {log.action === "ticket.created"      ? "created the ticket" :
                     log.action === "reply.added"         ? "added a reply" :
                     log.action === "ticket.status_changed" ? "changed status" :
                     log.action === "ticket.archived"     ? "archived the ticket" :
                     log.action}
                    <div className="aitem-time">{timeAgo(log.createdAt)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
