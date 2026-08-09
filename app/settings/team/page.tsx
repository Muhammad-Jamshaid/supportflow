import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Panel from "@/app/components/Panel";
import Avatar from "@/app/components/Avatar";
import InvitePanel from "@/app/components/InvitePanel";
import { revokeInviteAction } from "@/app/actions/team"; // need to create this

export default async function TeamSettingsPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") redirect("/settings");

  const companyId = session.user.companyId;

  const [company, agents, pendingInvites] = await Promise.all([
    prisma.company.findUnique({ where: { id: companyId }, select: { plan: true } }),
    prisma.user.findMany({
      where: { companyId, role: { in: ["ADMIN", "AGENT"] } },
      select: { id: true, name: true, email: true, role: true },
    }),
    prisma.inviteToken.findMany({
      where: { companyId, usedAt: null, expiresAt: { gt: new Date() } },
    }),
  ]);

  const planConfig = company ? await prisma.planConfig.findUnique({ where: { plan: company.plan } }) : null;
  const seatLimit = planConfig?.maxSeats ?? null;

  const activeSeatsCount = agents.length + pendingInvites.length;
  const isLimitReached = seatLimit !== null && activeSeatsCount >= seatLimit;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <Panel title="Team Members">
        <div style={{ padding: "0 18px" }}>
          {agents.map((agent) => (
            <div key={agent.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 0", borderBottom: "1px solid var(--border)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <Avatar name={agent.name} />
                <div>
                  <div style={{ fontWeight: 500, fontSize: "14px", color: "var(--ink)" }}>{agent.name ?? "Unnamed"}</div>
                  <div style={{ fontSize: "13px", color: "var(--text-muted)" }}>{agent.email}</div>
                </div>
              </div>
              <div style={{ fontSize: "13px", fontWeight: 500, color: "var(--text-muted)", background: "var(--bg)", padding: "4px 8px", borderRadius: "6px", border: "1px solid var(--border)" }}>
                {agent.role.charAt(0) + agent.role.slice(1).toLowerCase()}
              </div>
            </div>
          ))}
          {agents.length === 0 && (
            <div style={{ padding: "20px 0", color: "var(--text-muted)", fontSize: "14px" }}>No agents found.</div>
          )}
        </div>
      </Panel>

      {pendingInvites.length > 0 && (
        <Panel title="Pending Invites">
          <div style={{ padding: "0 18px" }}>
            {pendingInvites.map((invite) => (
              <div key={invite.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 0", borderBottom: "1px solid var(--border)" }}>
                <div>
                  <div style={{ fontWeight: 500, fontSize: "14px", color: "var(--ink)" }}>{invite.email}</div>
                  <div style={{ fontSize: "13px", color: "var(--text-muted)" }}>
                    Expires: {new Date(invite.expiresAt).toLocaleDateString()}
                  </div>
                </div>
                <form action={revokeInviteAction}>
                  <input type="hidden" name="id" value={invite.id} />
                  <button type="submit" className="btn btn-ghost btn-sm" style={{ color: "var(--red)" }}>Revoke</button>
                </form>
              </div>
            ))}
          </div>
        </Panel>
      )}

      <Panel title="Invite Teammate">
        <div style={{ padding: "0" }}>
          {isLimitReached ? (
            <div style={{ padding: "20px 18px", color: "var(--red)", fontSize: "14px" }}>
              Seat limit reached ({activeSeatsCount}/{seatLimit}). Upgrade your plan to invite more team members.
            </div>
          ) : (
            <InvitePanel />
          )}
        </div>
      </Panel>
    </div>
  );
}
