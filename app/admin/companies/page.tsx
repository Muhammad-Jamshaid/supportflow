import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import AppShell from "@/app/components/AppShell";
import AdminSidebar from "@/app/components/AdminSidebar";
import Panel from "@/app/components/Panel";
import DarkModeToggle from "@/app/components/DarkModeToggle";

export default async function AdminCompaniesPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (!session.user.isPlatformOwner) redirect("/dashboard");

  const companies = await prisma.company.findMany({
    include: {
      _count: {
        select: { users: { where: { role: { in: ["ADMIN", "AGENT"] } } }, tickets: true }
      }
    },
    orderBy: { createdAt: "desc" }
  });

  return (
    <AppShell sidebar={<AdminSidebar activePath="/admin/companies" adminName={session.user.name} />}>
      <div className="topbar">
        <h2>Companies</h2>
        <div className="topbar-right">
          <DarkModeToggle />
        </div>
      </div>
      <div className="content">
        <Panel title="All Companies">
          <div style={{ padding: "0" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)", background: "var(--bg)" }}>
                  <th style={{ padding: "12px 18px", fontWeight: 500, fontSize: "13px", color: "var(--text-muted)" }}>Name</th>
                  <th style={{ padding: "12px 18px", fontWeight: 500, fontSize: "13px", color: "var(--text-muted)" }}>Slug</th>
                  <th style={{ padding: "12px 18px", fontWeight: 500, fontSize: "13px", color: "var(--text-muted)" }}>Plan</th>
                  <th style={{ padding: "12px 18px", fontWeight: 500, fontSize: "13px", color: "var(--text-muted)" }}>Agents</th>
                  <th style={{ padding: "12px 18px", fontWeight: 500, fontSize: "13px", color: "var(--text-muted)" }}>Tickets</th>
                </tr>
              </thead>
              <tbody>
                {companies.map(company => (
                  <tr key={company.id} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ padding: "12px 18px", fontSize: "14px", fontWeight: 500, color: "var(--ink)" }}>{company.name}</td>
                    <td style={{ padding: "12px 18px", fontSize: "13px", color: "var(--text-muted)", fontFamily: "monospace" }}>{company.slug}</td>
                    <td style={{ padding: "12px 18px", fontSize: "13px", color: "var(--ink)" }}>{company.plan}</td>
                    <td style={{ padding: "12px 18px", fontSize: "13px", color: "var(--text-muted)" }}>{company._count.users}</td>
                    <td style={{ padding: "12px 18px", fontSize: "13px", color: "var(--text-muted)" }}>{company._count.tickets}</td>
                  </tr>
                ))}
                {companies.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ padding: "20px", textAlign: "center", color: "var(--text-muted)", fontSize: "14px" }}>No companies found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>
    </AppShell>
  );
}
