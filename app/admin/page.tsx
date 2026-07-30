import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import AppShell from "@/app/components/AppShell";
import AdminSidebar from "@/app/components/AdminSidebar";
import StatCard from "@/app/components/StatCard";
import Panel from "@/app/components/Panel";
import Avatar from "@/app/components/Avatar";
import DarkModeToggle from "@/app/components/DarkModeToggle";

export default async function AdminPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  // DEBUG: remove after confirming isPlatformOwner flows correctly
  console.log("[ADMIN PAGE] session.user at guard:", {
    id: session.user.id,
    email: session.user.email,
    role: session.user.role,
    isPlatformOwner: session.user.isPlatformOwner,
    isPlatformOwnerType: typeof session.user.isPlatformOwner,
  });

  // Platform-level access: only users with isPlatformOwner === true (set directly in DB).
  // This is NOT the same as Role.ADMIN (workspace admin) — a workspace admin
  // cannot see the platform overview unless isPlatformOwner is explicitly set.
  if (!session.user.isPlatformOwner) redirect("/dashboard");

  const companyId = session.user.companyId;

  // ── Real Prisma queries ───────────────────────────────────────────────────
  const [
    totalTickets,
    resolvedTickets,
    ,
    agents,
    company,
  ] = await Promise.all([
    prisma.ticket.count({ where: { companyId } }),
    prisma.ticket.count({ where: { companyId, status: "RESOLVED" } }),
    prisma.ticket.count({ where: { companyId, status: "OPEN" } }),
    prisma.user.findMany({
      where: { companyId, role: { in: ["AGENT", "ADMIN"] } },
      select: { id: true, name: true, role: true },
    }),
    prisma.company.findUnique({
      where: { id: companyId },
      select: { name: true, plan: true, createdAt: true },
    }),
  ]);

  const resolvedPct =
    totalTickets > 0 ? Math.round((resolvedTickets / totalTickets) * 100) : 0;
  const openPct = totalTickets > 0 ? 100 - resolvedPct : 0;

  const planLabel = company?.plan
    ? company.plan.charAt(0) + company.plan.slice(1).toLowerCase()
    : "Free";

  return (
    <AppShell
      sidebar={
        <AdminSidebar activePath="/admin" adminName={session.user.name} />
      }
    >
      {/* Topbar */}
      <div className="topbar">
        <h2>Analytics</h2>
        <div className="topbar-right">
          <DarkModeToggle />
          <button className="fchip" type="button">
            Last 30 days ▾
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="content">
        {/* Stat cards */}
        <div className="stats">
          <StatCard
            label="Ticket volume"
            value={totalTickets === 0 ? "0" : totalTickets.toLocaleString()}
            delta={totalTickets === 0 ? "No tickets yet" : undefined}
          />
          <StatCard
            label="Avg resolution time"
            value="—"
            delta="Available after first resolutions"
          />
          <StatCard
            label="Resolved / Open"
            value={totalTickets === 0 ? "— / —" : `${resolvedPct}% / ${openPct}%`}
            delta={totalTickets === 0 ? "No data yet" : "Based on all tickets"}
          />
          <StatCard
            label="Active agents"
            value={agents.length}
            delta={agents.length === 0 ? "Invite agents to get started" : undefined}
          />
        </div>

        {/* Charts row */}
        <div className="chart-row">
          {/* Ticket volume over time — static SVG (real chart in Phase 2) */}
          <div className="chart-card">
            <h3>Tickets over time</h3>
            <div className="chart-sub">Daily volume — real chart coming in Phase 2</div>
            {totalTickets === 0 ? (
              <div className="empty-state" style={{ padding: "30px 0" }}>
                <div className="empty-icon" style={{ fontSize: "28px" }}>▤</div>
                <h3>No ticket data yet</h3>
                <p>The chart will populate once tickets start coming in.</p>
              </div>
            ) : (
              <>
                <svg
                  viewBox="0 0 400 140"
                  width="100%"
                  height="140"
                  preserveAspectRatio="none"
                >
                  <polyline
                    fill="none"
                    stroke="var(--border-strong)"
                    strokeWidth="1"
                    points="0,20 400,20"
                  />
                  <polyline
                    fill="none"
                    stroke="var(--border-strong)"
                    strokeWidth="1"
                    points="0,70 400,70"
                  />
                  <polyline
                    fill="none"
                    stroke="var(--border-strong)"
                    strokeWidth="1"
                    points="0,120 400,120"
                  />
                  <polyline
                    fill="none"
                    stroke="var(--brand)"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points="0,120 100,110 200,100 300,80 400,60"
                  />
                </svg>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "11px",
                    color: "var(--text-muted)",
                    marginTop: "6px",
                  }}
                >
                  <span>Earlier</span>
                  <span>Recent</span>
                </div>
              </>
            )}
          </div>

          {/* Ticket by category — placeholder donut */}
          <div className="chart-card">
            <h3>Tickets by category</h3>
            <div className="chart-sub">Share of total</div>
            {totalTickets === 0 ? (
              <div className="empty-state" style={{ padding: "30px 0" }}>
                <div className="empty-icon" style={{ fontSize: "28px" }}>◐</div>
                <h3>No data yet</h3>
                <p>Category breakdown will appear once tickets are created.</p>
              </div>
            ) : (
              <div className="donut-wrap" style={{ marginTop: "14px" }}>
                <div className="donut" />
                <div className="legend">
                  <div className="legend-item">
                    <span
                      className="legend-dot"
                      style={{ background: "var(--brand)" }}
                    />
                    General
                    <span className="lv">100%</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Agent performance panel */}
        <Panel title="Agent performance">
          <div className="agent-row head">
            <div>Agent</div>
            <div>Resolved</div>
            <div>Avg time</div>
            <div>Role</div>
          </div>
          {agents.length === 0 ? (
            <div className="empty-state" style={{ padding: "30px 20px" }}>
              <div className="empty-icon">◧</div>
              <h3>No agents yet</h3>
              <p>
                Invite team members to your workspace and assign them the Agent
                role to see performance metrics here.
              </p>
            </div>
          ) : (
            agents.map((agent) => (
              <div key={agent.id} className="agent-row">
                <div className="agent-name">
                  <Avatar name={agent.name} />
                  {agent.name ?? "Unnamed"}
                </div>
                <div>—</div>
                <div>—</div>
                <div style={{ color: "var(--text-muted)", fontSize: "12px" }}>
                  {agent.role.charAt(0) + agent.role.slice(1).toLowerCase()}
                </div>
              </div>
            ))
          )}
        </Panel>

        {/* Billing panel */}
        <Panel title="Billing">
          <div className="billing-card">
            <div>
              <div style={{ fontWeight: 600, fontSize: "14px" }}>
                {planLabel} plan
              </div>
              <div
                style={{
                  fontSize: "12.5px",
                  color: "var(--text-muted)",
                  marginTop: "2px",
                }}
              >
                {agents.length} seat{agents.length !== 1 ? "s" : ""} · workspace
                since{" "}
                {company?.createdAt
                  ? new Date(company.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      year: "numeric",
                    })
                  : "—"}
              </div>
            </div>
            <button className="btn btn-ghost btn-sm" type="button">
              Manage subscription
            </button>
          </div>
        </Panel>
      </div>
    </AppShell>
  );
}
