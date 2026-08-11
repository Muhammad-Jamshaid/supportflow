import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Panel from "@/app/components/Panel";
import Avatar from "@/app/components/Avatar";
import CopyButton from "@/app/components/CopyButton";
import { updateProfileName, updateWorkspaceName } from "@/app/actions/settings";

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const company = await prisma.company.findUnique({
    where: { id: session.user.companyId },
    select: { name: true, plan: true, createdAt: true, slug: true },
  });

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { passwordHash: true }
  });

  const planLabel = company?.plan
    ? company.plan.charAt(0) + company.plan.slice(1).toLowerCase()
    : "Free";

  const origin =
    process.env.NEXTAUTH_URL?.replace(/\/$/, "") || "http://localhost:3000";
  const supportUrl = company?.slug ? `${origin}/support/${company.slug}` : null;

  return (
    <>
      <Panel title="Your profile">
        <div style={{ padding: "20px 18px", display: "flex", flexDirection: "column", gap: "24px" }}>
          
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <Avatar name={session.user.name} size="lg" />
            <div>
              <div style={{ fontWeight: 600, fontSize: "14px", color: "var(--ink)" }}>
                {session.user.name ?? "—"}
              </div>
              <div style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "2px" }}>
                {session.user.email}
              </div>
            </div>
          </div>

          <form action={updateProfileName} style={{ display: "flex", gap: "12px", alignItems: "flex-end", padding: 0, border: "none" }}>
            <label className="field" style={{ flex: 1, margin: 0 }}>
              <span className="lbl">Display Name</span>
              <input
                type="text"
                name="name"
                defaultValue={session.user.name || ""}
                placeholder="Enter your name"
                className="input"
                style={{ width: "240px" }}
                required
              />
            </label>
            <button type="submit" className="btn btn-primary" style={{ height: "42px" }}>Save Changes</button>
          </form>

          {user?.passwordHash && (
            <div style={{ fontSize: "13px", color: "var(--text-muted)", padding: "12px", background: "var(--bg)", borderRadius: "6px", border: "1px solid var(--border)" }}>
              Password management coming in a future update.
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: "12px", borderTop: "1px solid var(--border)", paddingTop: "20px" }}>
            <div className="kv">
              <span className="k">Role</span>
              <span>
                {session.user.role === "ADMIN"
                  ? "Admin"
                  : session.user.role === "AGENT"
                  ? "Agent"
                  : "Customer"}
              </span>
            </div>
            <div className="kv">
              <span className="k">User ID</span>
              <span className="mono" style={{ fontSize: "12px" }}>
                {session.user.id}
              </span>
            </div>
          </div>
        </div>
      </Panel>

      <div style={{ marginTop: "24px" }} />

      <Panel title="Workspace">
        <div style={{ padding: "0 18px" }}>
          {session.user.role === "ADMIN" ? (
            <form action={updateWorkspaceName} className="kv" style={{ display: "flex", gap: "12px", alignItems: "center" }}>
              <span className="k" style={{ minWidth: "140px" }}>Workspace name</span>
              <div style={{ display: "flex", flex: 1, gap: "12px" }}>
                <input
                  type="text"
                  name="companyName"
                  defaultValue={company?.name || ""}
                  placeholder="Acme Inc."
                  className="input"
                  style={{ flex: 1, margin: 0 }}
                  required
                />
                <button type="submit" className="btn btn-primary">Save</button>
              </div>
            </form>
          ) : (
            <div className="kv">
              <span className="k">Workspace name</span>
              <span>{company?.name ?? "—"}</span>
            </div>
          )}
          <div className="kv">
            <span className="k">Plan</span>
            <span>{planLabel}</span>
          </div>
          <div className="kv">
            <span className="k">Created</span>
            <span>
              {company?.createdAt
                ? new Date(company.createdAt).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })
                : "—"}
            </span>
          </div>
        </div>
      </Panel>

      <div style={{ marginTop: "24px" }} />

      {supportUrl && (
        <Panel title="Public support link">
          <div style={{ padding: "16px 18px", display: "flex", flexDirection: "column", gap: "12px" }}>
            <p style={{ fontSize: "13px", color: "var(--text-muted)", margin: 0 }}>
              Share this link with customers so they can submit support tickets
              without needing an account.
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div
                className="mono"
                style={{
                  flex: 1,
                  fontSize: "13px",
                  padding: "8px 12px",
                  background: "var(--bg)",
                  border: "1px solid var(--border)",
                  borderRadius: "6px",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  color: "var(--ink)",
                }}
              >
                {supportUrl}
              </div>
              <CopyButton text={supportUrl} />
            </div>
          </div>
        </Panel>
      )}
    </>
  );
}
