import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Panel from "@/app/components/Panel";
import { UpgradeButton, ManageSubscriptionButton } from "./BillingButtons";

export default async function BillingSettingsPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") redirect("/settings");

  const companyId = session.user.companyId;

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [company, activeAgents, pendingInvites, ticketsThisMonth] = await Promise.all([
    prisma.company.findUnique({ where: { id: companyId }, select: { plan: true } }),
    prisma.user.count({ where: { companyId, role: { in: ["ADMIN", "AGENT"] } } }),
    prisma.inviteToken.count({ where: { companyId, usedAt: null, expiresAt: { gt: new Date() } } }),
    prisma.ticket.count({ where: { companyId, createdAt: { gte: startOfMonth } } }),
  ]);

  const planConfig = company ? await prisma.planConfig.findUnique({ where: { plan: company.plan } }) : null;

  const activeSeatsCount = activeAgents + pendingInvites;
  const planLabel = company?.plan ? company.plan.charAt(0) + company.plan.slice(1).toLowerCase() : "Free";
  const isFree = company?.plan === "FREE";

  const seatLimit = planConfig?.maxSeats ?? null;
  const ticketLimit = planConfig?.maxTickets ?? null;

  const seatPct = seatLimit ? Math.min(100, Math.round((activeSeatsCount / seatLimit) * 100)) : 0;
  const ticketPct = ticketLimit ? Math.min(100, Math.round((ticketsThisMonth / ticketLimit) * 100)) : 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <Panel title="Current Plan">
        <div style={{ padding: "20px 18px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: "18px", fontWeight: 600, color: "var(--ink)", marginBottom: "4px" }}>
              {planLabel} Plan
            </div>
            <div style={{ fontSize: "13px", color: "var(--text-muted)" }}>
              {isFree ? "Basic features for small teams." : "Advanced features and unlimited limits."}
            </div>
          </div>
          {!isFree && (
            <ManageSubscriptionButton />
          )}
        </div>
      </Panel>

      {isFree && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          <Panel title="Pro Plan">
            <div style={{ padding: "20px 18px", display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ fontSize: "24px", fontWeight: 700 }}>$29<span style={{ fontSize: "14px", fontWeight: 400, color: "var(--text-muted)" }}>/mo</span></div>
              <ul style={{ fontSize: "14px", color: "var(--text-muted)", paddingLeft: "20px", margin: 0 }}>
                <li>Unlimited Tickets</li>
                <li>Up to 10 Agents</li>
                <li>Advanced Analytics</li>
              </ul>
              <UpgradeButton priceId={process.env.STRIPE_PRO_PRICE_ID!} planName="Pro" />
            </div>
          </Panel>
          
          <Panel title="Team Plan">
            <div style={{ padding: "20px 18px", display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ fontSize: "24px", fontWeight: 700 }}>$79<span style={{ fontSize: "14px", fontWeight: 400, color: "var(--text-muted)" }}>/mo</span></div>
              <ul style={{ fontSize: "14px", color: "var(--text-muted)", paddingLeft: "20px", margin: 0 }}>
                <li>Unlimited Tickets</li>
                <li>Unlimited Agents</li>
                <li>Priority Support</li>
              </ul>
              <UpgradeButton priceId={process.env.STRIPE_TEAM_PRICE_ID!} planName="Team" />
            </div>
          </Panel>
        </div>
      )}

      <Panel title="Usage Limits">
        <div style={{ padding: "20px 18px", display: "flex", flexDirection: "column", gap: "24px" }}>
          
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
              <span style={{ fontSize: "14px", fontWeight: 500 }}>Active Agent Seats</span>
              <span style={{ fontSize: "14px", color: "var(--text-muted)" }}>{activeSeatsCount} / {seatLimit === null ? "Unlimited" : seatLimit}</span>
            </div>
            {seatLimit !== null && (
              <div style={{ width: "100%", height: "8px", background: "var(--border)", borderRadius: "4px", overflow: "hidden" }}>
                <div style={{ width: `${seatPct}%`, height: "100%", background: seatPct >= 100 ? "var(--red)" : "var(--brand)" }} />
              </div>
            )}
          </div>

          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
              <span style={{ fontSize: "14px", fontWeight: 500 }}>Tickets This Month</span>
              <span style={{ fontSize: "14px", color: "var(--text-muted)" }}>{ticketsThisMonth} / {ticketLimit === null ? "Unlimited" : ticketLimit}</span>
            </div>
            {ticketLimit !== null && (
              <div style={{ width: "100%", height: "8px", background: "var(--border)", borderRadius: "4px", overflow: "hidden" }}>
                <div style={{ width: `${ticketPct}%`, height: "100%", background: ticketPct >= 100 ? "var(--red)" : "var(--brand)" }} />
              </div>
            )}
          </div>

        </div>
      </Panel>
    </div>
  );
}
