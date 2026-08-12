import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import AppShell from "@/app/components/AppShell";
import Sidebar from "@/app/components/Sidebar";
import Panel from "@/app/components/Panel";
import { createAgentTicketAction } from "@/app/actions/tickets";
import DarkModeToggle from "@/app/components/DarkModeToggle";
import NewTicketFormClient from "./NewTicketFormClient";

export default async function NewTicketPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (session.user.role === "CUSTOMER") redirect("/submit-ticket");

  const company = await prisma.company.findUnique({
    where: { id: session.user.companyId },
    select: { name: true },
  });

  // Fetch only customers belonging to this agent's company
  const customers = await prisma.user.findMany({
    where: { companyId: session.user.companyId, role: "CUSTOMER" },
    select: { id: true, name: true, email: true },
    orderBy: { name: "asc" },
  });



  return (
    <AppShell
      sidebar={
        <Sidebar
          activePath="/tickets"
          userName={session.user.name}
          userRole={session.user.role}
          companyName={company?.name}
        />
      }
    >
      <div className="topbar">
        <Link
          href="/tickets"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            fontSize: "14px",
            fontWeight: 500,
          }}
        >
          ← Back to tickets
        </Link>
        <div className="topbar-right">
          <DarkModeToggle />
        </div>
      </div>

      <div className="content">
        <div style={{ maxWidth: "600px", margin: "0 auto" }}>
          <Panel>
            <div className="panel-head">
              <h3>Create New Ticket</h3>
            </div>
            <div style={{ padding: "20px" }}>
              <NewTicketFormClient customers={customers} />
            </div>
          </Panel>
        </div>
      </div>
    </AppShell>
  );
}
