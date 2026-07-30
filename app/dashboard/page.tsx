import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ticketWhere } from "@/lib/ticket-rbac";
import Link from "next/link";
import AppShell from "@/app/components/AppShell";
import Sidebar from "@/app/components/Sidebar";
import StatCard from "@/app/components/StatCard";
import Panel from "@/app/components/Panel";
import Pill, { priorityVariant } from "@/app/components/Pill";
import DarkModeToggle from "@/app/components/DarkModeToggle";

function getGreeting(name?: string | null) {
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const first = name?.split(" ")[0] ?? "there";
  return `${greeting}, ${first}`;
}

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const companyId = session.user.companyId;

  // ── Real Prisma queries scoped to this tenant ─────────────────────────────
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  // 1. Determine if we need to restrict activity target IDs (for CUSTOMERs)
  let allowedTargetIds: string[] | undefined = undefined;
  
  if (session.user.role === "CUSTOMER") {
    const userTickets = await prisma.ticket.findMany({
      where: ticketWhere(session),
      select: { id: true }
    });
    allowedTargetIds = userTickets.map(t => t.id);
  }

  const [
    openCount,
    resolvedTodayCount,
    urgentUnassignedCount,
    recentTickets,
    recentActivity,
    company,
  ] = await Promise.all([
    prisma.ticket.count({
      where: { status: "OPEN", ...ticketWhere(session) },
    }),
    prisma.ticket.count({
      where: {
        status: "RESOLVED",
        updatedAt: { gte: todayStart },
        ...ticketWhere(session)
      },
    }),
    prisma.ticket.count({
      where: {
        priority: "URGENT",
        assignedAgentId: null,
        status: "OPEN",
        ...ticketWhere(session)
      },
    }),
    prisma.ticket.findMany({
      where: ticketWhere(session),
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        customer: { select: { name: true } },
        assignedAgent: { select: { name: true } },
      },
    }),
    prisma.activityLog.findMany({
      where: {
        companyId,
        ...(allowedTargetIds !== undefined && {
          targetId: { in: allowedTargetIds }
        })
      },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        user: { select: { name: true } },
      },
    }),
    prisma.company.findUnique({
      where: { id: companyId },
      select: { name: true },
    }),
  ]);

  return (
    <AppShell
      sidebar={
        <Sidebar
          activePath="/dashboard"
          userName={session.user.name}
          userRole={session.user.role}
          companyName={company?.name}
        />
      }
    >
      {/* Topbar */}
      <div className="topbar">
        <h2>{getGreeting(session.user.name)}</h2>
        <div className="topbar-right">
          <DarkModeToggle />
          <input
            className="search"
            type="search"
            placeholder="Search tickets…"
            aria-label="Search tickets"
          />
          <Link href="/tickets/new" className="btn btn-primary btn-sm">
            New ticket
          </Link>
        </div>
      </div>

      {/* Content */}
      <div className="content">
        {/* Stat cards */}
        <div className="stats">
          <StatCard
            label="Open tickets"
            value={openCount}
            delta={openCount === 0 ? "No open tickets" : undefined}
          />
          <StatCard
            label="Resolved today"
            value={resolvedTodayCount}
            delta={resolvedTodayCount === 0 ? "None yet today" : "↑ on pace"}
          />
          <StatCard
            label="Avg resolution time"
            value="—"
            delta="Available after first tickets"
          />
          <StatCard
            label="Urgent, unassigned"
            value={urgentUnassignedCount}
            delta={urgentUnassignedCount > 0 ? "Needs attention" : "All clear"}
            deltaVariant={urgentUnassignedCount > 0 ? "urgent" : "normal"}
          />
        </div>

        {/* Queue panel */}
        <Panel
          title="Your queue"
          action={
            <Link href="/tickets" style={{ fontSize: "12.5px", color: "var(--brand)", fontWeight: 600 }}>
              View all tickets →
            </Link>
          }
        >
          <div className="trow head">
            <div>ID</div>
            <div>Ticket</div>
            <div>Category</div>
            <div>Priority</div>
            <div>Customer</div>
            <div>Waiting</div>
          </div>

          {recentTickets.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">▤</div>
              <h3>No tickets yet</h3>
              <p>
                Tickets submitted to your workspace will appear here. Create
                your first ticket to get started.
              </p>
            </div>
          ) : (
            recentTickets.map((ticket) => (
              <Link
                key={ticket.id}
                href={`/tickets/${ticket.id}`}
                style={{ display: "contents" }}
              >
                <div className="trow" style={{ cursor: "pointer" }}>
                  <div className="mono tcust">
                    #{ticket.id.slice(-4).toUpperCase()}
                  </div>
                  <div>
                    <div className="tsubj">{ticket.subject}</div>
                    <div className="tsub-meta">
                      {ticket.customer.name ?? "Unknown customer"}
                    </div>
                  </div>
                  <div className="tcust">General</div>
                  <div>
                    <Pill variant={priorityVariant(ticket.priority)}>
                      {ticket.priority.charAt(0) + ticket.priority.slice(1).toLowerCase()}
                    </Pill>
                  </div>
                  <div className="tcust">
                    {ticket.customer.name ?? "—"}
                  </div>
                  <div className="tcust">{timeAgo(ticket.createdAt)}</div>
                </div>
              </Link>
            ))
          )}
        </Panel>

        {/* Activity panel */}
        <Panel title="Recent activity">
          <div className="activity">
            {recentActivity.length === 0 ? (
              <div className="empty-state" style={{ padding: "30px 20px" }}>
                <div className="empty-icon">◐</div>
                <h3>No activity yet</h3>
                <p>Actions taken in your workspace will be logged here.</p>
              </div>
            ) : (
              recentActivity.map((log) => (
                <div key={log.id} className="aitem">
                  <div className="adot" />
                  <div>
                    <span>
                      <b>{log.user.name ?? "Someone"}</b> {log.action}
                      {log.targetId ? (
                        <>
                          {" "}
                          <b>#{log.targetId.slice(-4).toUpperCase()}</b>
                        </>
                      ) : null}
                    </span>
                    <div className="atime">{timeAgo(log.createdAt)}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </Panel>
      </div>
    </AppShell>
  );
}
