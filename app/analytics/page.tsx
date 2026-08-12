import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import AppShell from "@/app/components/AppShell";
import Sidebar from "@/app/components/Sidebar";
import StatCard from "@/app/components/StatCard";
import DarkModeToggle from "@/app/components/DarkModeToggle";
import EmptyState from "@/app/components/EmptyState";

export default async function AnalyticsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  // Customers only track their own submissions — analytics is for Agents and Admins
  if (session.user.role === "CUSTOMER") redirect("/tickets");

  const companyId = session.user.companyId;

  const [totalTickets, resolvedTickets, openTickets, company, categoryGroups] =
    await Promise.all([
      prisma.ticket.count({ where: { companyId } }),
      prisma.ticket.count({ where: { companyId, status: "RESOLVED" } }),
      prisma.ticket.count({ where: { companyId, status: "OPEN" } }),
      prisma.company.findUnique({
        where: { id: companyId },
        select: { name: true },
      }),
      prisma.ticket.groupBy({
        by: ['aiCategory'],
        where: { companyId },
        _count: { id: true },
      }),
    ]);

  const resolvedPct =
    totalTickets > 0 ? Math.round((resolvedTickets / totalTickets) * 100) : 0;
  const openPct = totalTickets > 0 ? 100 - resolvedPct : 0;
  const hasData = totalTickets > 0;

  // Calculate category percentages
  const totalCategoryTickets = categoryGroups.reduce((acc, curr) => acc + curr._count.id, 0);
  const categoryStats = categoryGroups.map(g => ({
    category: g.aiCategory || 'Uncategorized',
    count: g._count.id,
    pct: totalCategoryTickets > 0 ? Math.round((g._count.id / totalCategoryTickets) * 100) : 0
  })).sort((a, b) => b.count - a.count);

  // Colors for donut chart
  const COLORS = ["var(--brand)", "#a855f7", "#ec4899", "#3b82f6", "#10b981", "#64748b"];

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
              <div style={{ padding: "20px 0" }}>
                <EmptyState
                  compact
                  icon={
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                    </svg>
                  }
                  title="No data yet"
                  description="The chart will populate once tickets start coming in."
                />
              </div>
            )}
          </div>

          {/* Category breakdown */}
          <div className="chart-card">
            <h3>Tickets by category</h3>
            <div className="chart-sub">Share of total</div>
            {hasData ? (
              <div className="donut-wrap" style={{ marginTop: "14px" }}>
                {/* Visual donut representation using conic-gradient based on categories */}
                <div 
                  className="donut" 
                  style={{
                    background: categoryStats.length > 0 
                      ? `conic-gradient(${categoryStats.reduce((acc, stat, i) => {
                          const prevPct = i === 0 ? 0 : categoryStats.slice(0, i).reduce((sum, s) => sum + s.pct, 0);
                          return acc + `${COLORS[i % COLORS.length]} ${prevPct}% ${prevPct + stat.pct}%, `;
                        }, "").slice(0, -2)})`
                      : 'var(--brand-soft-2)'
                  }}
                />
                <div className="legend">
                  {categoryStats.map((stat, i) => (
                    <div key={stat.category} className="legend-item">
                      <span
                        className="legend-dot"
                        style={{ background: COLORS[i % COLORS.length] }}
                      />
                      {stat.category}
                      <span className="lv">{stat.pct}%</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div style={{ padding: "20px 0" }}>
                <EmptyState
                  compact
                  icon={
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
                    </svg>
                  }
                  title="No data yet"
                  description="Category breakdown will appear once tickets are created."
                />
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
            Advanced analytics like resolution times and agent performance will be added in a future update. AI Triage categories are live.
          </span>
        </div>
      </div>
    </AppShell>
  );
}
