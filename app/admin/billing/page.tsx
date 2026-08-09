import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import AppShell from "@/app/components/AppShell";
import AdminSidebar from "@/app/components/AdminSidebar";
import Panel from "@/app/components/Panel";
import DarkModeToggle from "@/app/components/DarkModeToggle";
import { Plan } from "@prisma/client";
import PlanConfigEditor from "./PlanConfigEditor";

export default async function AdminBillingPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (!session.user.isPlatformOwner) redirect("/dashboard");

  const companyPlans = await prisma.company.groupBy({
    by: ['plan'],
    _count: { plan: true }
  });

  const getCount = (plan: Plan) => companyPlans.find(c => c.plan === plan)?._count.plan || 0;
  const freeCount = getCount("FREE");
  const proCount = getCount("PRO");
  const teamCount = getCount("TEAM");

  const planConfigs = await prisma.planConfig.findMany();

  return (
    <AppShell sidebar={<AdminSidebar activePath="/admin/billing" adminName={session.user.name} />}>
      <div className="topbar">
        <h2>Billing Overview</h2>
        <div className="topbar-right">
          <DarkModeToggle />
        </div>
      </div>
      <div className="content">
        <Panel title="Companies by Plan Tier">
          <div style={{ padding: "0 18px", display: "flex", flexDirection: "column", gap: "16px", paddingBottom: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: "1px solid var(--border)" }}>
              <div style={{ fontWeight: 500, fontSize: "15px", color: "var(--ink)" }}>Free Plan</div>
              <div style={{ fontSize: "15px", color: "var(--text-muted)" }}>{freeCount} companies</div>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: "1px solid var(--border)" }}>
              <div style={{ fontWeight: 500, fontSize: "15px", color: "var(--brand)" }}>Pro Plan</div>
              <div style={{ fontSize: "15px", color: "var(--text-muted)" }}>{proCount} companies</div>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0" }}>
              <div style={{ fontWeight: 500, fontSize: "15px", color: "var(--ink)" }}>Team Plan</div>
              <div style={{ fontSize: "15px", color: "var(--text-muted)" }}>{teamCount} companies</div>
            </div>
          </div>
        </Panel>
        <Panel title="Plan Limits Configuration">
          <div style={{ padding: "0 18px", paddingBottom: "20px" }}>
            <p style={{ fontSize: "14px", color: "var(--text-muted)", marginBottom: "16px" }}>
              Configure max seats and max tickets for each plan tier. Leave empty for unlimited.
            </p>
            <PlanConfigEditor configs={planConfigs} />
          </div>
        </Panel>
      </div>
    </AppShell>
  );
}
