import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import AppShell from "@/app/components/AppShell";
import AdminSidebar from "@/app/components/AdminSidebar";
import Panel from "@/app/components/Panel";
import Avatar from "@/app/components/Avatar";
import DarkModeToggle from "@/app/components/DarkModeToggle";
import { promotePlatformOwnerAction, demotePlatformOwnerAction } from "@/app/actions/admin";

export default async function AdminTeamPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (!session.user.isPlatformOwner) redirect("/dashboard");

  const owners = await prisma.user.findMany({
    where: { isPlatformOwner: true },
    select: { id: true, name: true, email: true },
    orderBy: { createdAt: "asc" }
  });

  return (
    <AppShell sidebar={<AdminSidebar activePath="/admin/team" adminName={session.user.name} />}>
      <div className="topbar">
        <h2>Platform Team</h2>
        <div className="topbar-right">
          <DarkModeToggle />
        </div>
      </div>
      <div className="content">
        <Panel title="Platform Owners">
          <div style={{ padding: "0 18px" }}>
            {owners.map((owner) => (
              <div key={owner.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 0", borderBottom: "1px solid var(--border)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <Avatar name={owner.name} />
                  <div>
                    <div style={{ fontWeight: 500, fontSize: "14px", color: "var(--ink)" }}>{owner.name ?? "Unnamed"}</div>
                    <div style={{ fontSize: "13px", color: "var(--text-muted)" }}>{owner.email}</div>
                  </div>
                </div>
                {owner.id !== session.user.id && (
                  <form action={demotePlatformOwnerAction}>
                    <input type="hidden" name="id" value={owner.id} />
                    <button type="submit" className="btn btn-ghost btn-sm" style={{ color: "var(--red)" }}>Remove</button>
                  </form>
                )}
                {owner.id === session.user.id && (
                  <div style={{ fontSize: "13px", fontWeight: 500, color: "var(--text-muted)", padding: "4px 8px" }}>You</div>
                )}
              </div>
            ))}
          </div>
        </Panel>

        <div style={{ marginTop: "24px" }} />

        <Panel title="Add Platform Owner">
          <div style={{ padding: "20px 18px" }}>
            <p style={{ fontSize: "13px", color: "var(--text-muted)", margin: "0 0 16px 0" }}>
              Enter the email address of an existing user on the platform to promote them to Platform Owner. They will gain full access to the admin panel.
            </p>
            <form action={promotePlatformOwnerAction} style={{ display: "flex", gap: "12px", alignItems: "flex-end" }}>
              <label className="field" style={{ flex: 1, margin: 0 }}>
                <span className="lbl">Email address</span>
                <input type="email" name="email" required placeholder="user@example.com" className="input" />
              </label>
              <button type="submit" className="btn btn-primary" style={{ height: "36px" }}>Promote</button>
            </form>
          </div>
        </Panel>
      </div>
    </AppShell>
  );
}
