import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import AppShell from "@/app/components/AppShell";
import Sidebar from "@/app/components/Sidebar";
import StatCard from "@/app/components/StatCard";
import DarkModeToggle from "@/app/components/DarkModeToggle";

export default async function AnalyticsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  // Customers only track their own submissions — analytics is for Agents and Admins
  if (session.user.role === "CUSTOMER") redirect("/tickets");

  const companyId = session.user.companyId;

  const [totalTickets, resolvedTickets, openTickets, company] =
    await Promise.all([
      prisma.ticket.count({ where: { companyId } }),
      prisma.ticket.count({ where: { companyId, status: "RESOLVED" } }),
      prisma.ticket.count({ where: { companyId, status: "OPEN" } }),
      prisma.company.findUnique({
        where: { id: companyId },
        select: { name: true },
      }),
    ]);

  const resolvedPct =
    totalTickets > 0 ? Math.round((resolvedTickets / totalTickets) * 100) : 0;
  const openPct = totalTickets > 0 ? 100 - resolvedPct : 0;
  const hasData = totalTickets > 0;

  return (
    <AppShell
      sidebar={
        <Sidebar
          activePath="/analytics"
          userName={session.user.name}
          userRole={session.user.role}
          companyName={company?.name}
        />
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
        {/* Stat cards — always show with real values (zeros until Phase 2) */}
        <div className="stats">
          <StatCard
            label="Total tickets"
            value={totalTickets}
            delta={hasData ? undefined : "No tickets yet"}
          />
          <StatCard
            label="Open"
            value={hasData ? openTickets : "—"}
            delta={hasData ? `${openPct}% of total` : undefined}
          />
          <StatCard
            label="Resolved"
            value={hasData ? resolvedTickets : "—"}
            delta={hasData ? `${resolvedPct}% resolution rate` : undefined}
          />
          <StatCard
            label="Avg resolution time"
            value="—"
            delta="Available after first resolutions"
          />
        </div>

        {/* Volume chart — empty state until tickets exist */}
        <div className="chart-row">
          <div className="chart-card">
            <h3>Ticket volume over time</h3>
            <div className="chart-sub">Daily volume, last 30 days</div>
            {hasData ? (
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
            ) : (
              <div className="empty-state" style={{ padding: "30px 0" }}>
                <div className="empty-icon">▤</div>
                <h3>No data yet</h3>
                <p>
                  The chart will populate once tickets start coming in. Create
                  tickets in Phase 2 to see volume trends here.
                </p>
              </div>
            )}
          </div>

          {/* Category breakdown */}
          <div className="chart-card">
            <h3>Tickets by category</h3>
            <div className="chart-sub">Share of total</div>
            {hasData ? (
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
            ) : (
              <div className="empty-state" style={{ padding: "30px 0" }}>
                <div className="empty-icon">◐</div>
                <h3>No data yet</h3>
                <p>Category breakdown will appear once tickets are created.</p>
              </div>
            )}
          </div>
        </div>

        {/* Notice */}
        <div
          style={{
            background: "var(--brand-soft)",
            border: "1px solid var(--brand-soft-2)",
            borderRadius: "10px",
            padding: "14px 18px",
            fontSize: "13px",
            color: "var(--text-muted)",
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <span style={{ color: "var(--brand)", fontSize: "16px" }}>✦</span>
          <span>
            Full analytics — resolution times, agent performance, ticket trends
            — will be available once ticket creation launches in Phase 2.
          </span>
        </div>
      </div>
    </AppShell>
  );
}
