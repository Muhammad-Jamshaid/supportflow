import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import AppShell from "@/app/components/AppShell";
import Sidebar from "@/app/components/Sidebar";
import Panel from "@/app/components/Panel";
import DarkModeToggle from "@/app/components/DarkModeToggle";
import Avatar from "@/app/components/Avatar";
import Pill, { priorityVariant } from "@/app/components/Pill";

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default async function CustomerDetailPage({
  params
}: {
  params: { id: string }
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  if (session.user.role === "CUSTOMER") {
    redirect("/dashboard");
  }

  const customerId = params.id;

  const customer = await prisma.user.findFirst({
    where: {
      id: customerId,
      role: "CUSTOMER",
      companyId: session.user.companyId
    },
    select: {
      name: true,
      email: true,
      createdAt: true
    }
  });

  if (!customer) {
    notFound();
  }

  const tickets = await prisma.ticket.findMany({
    where: {
      customerId: customerId,
      companyId: session.user.companyId,
      archived: false
    },
    include: {
      assignedAgent: { select: { name: true } }
    },
    orderBy: { updatedAt: "desc" }
  });

  const company = await prisma.company.findUnique({
    where: { id: session.user.companyId },
    select: { name: true }
  });

  return (
    <AppShell
      sidebar={
        <Sidebar
          activePath="/customers"
          userName={session.user.name}
          userRole={session.user.role}
          companyName={company?.name}
        />
      }
    >
      <div className="topbar">
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <Link href="/customers" className="btn btn-ghost btn-sm" style={{ padding: "4px 8px" }}>
            ← Back
          </Link>
          <h2>Customer Details</h2>
        </div>
        <div className="topbar-right">
          <DarkModeToggle />
        </div>
      </div>

      <div className="content">
        <div style={{ display: "flex", gap: "24px", flexDirection: "column" }}>
          {/* Profile Card */}
          <Panel>
            <div style={{ padding: "24px", display: "flex", gap: "20px", alignItems: "center" }}>
              <Avatar name={customer.name || customer.email} />
              <div>
                <h3 style={{ fontSize: "18px", margin: "0 0 4px 0", color: "var(--ink)" }}>{customer.name || "Unnamed"}</h3>
                <div style={{ fontSize: "14px", color: "var(--text-muted)" }}>{customer.email}</div>
                <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px" }}>
                  Customer since {new Date(customer.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>
          </Panel>

          {/* Ticket History */}
          <Panel>
            <div className="panel-head">
              <h3>Ticket History ({tickets.length})</h3>
            </div>
            
            <div className="trow head" style={{ gridTemplateColumns: "70px 1fr 110px 100px 90px 90px" }}>
              <div>ID</div>
              <div>Ticket</div>
              <div>Category</div>
              <div>Priority</div>
              <div>Assigned</div>
              <div>Updated</div>
            </div>

            {tickets.length === 0 ? (
              <div className="empty-state" style={{ padding: "40px" }}>
                <div className="empty-icon">🎫</div>
                <h3>No tickets yet</h3>
                <p className="empty-sub">This customer has not submitted any tickets.</p>
              </div>
            ) : (
              tickets.map((t) => {
                const isUnread = t.status === "OPEN"; // basic heuristic
                const idShort = "#" + t.id.slice(-4).toUpperCase();
                return (
                  <Link href={`/tickets/${t.id}`} key={t.id} className={`trow ${isUnread ? "unread" : ""}`} style={{ gridTemplateColumns: "70px 1fr 110px 100px 90px 90px" }}>
                    <div className="id-col">{idShort}</div>
                    
                    <div className="subj-col">
                      <div className="subj">{t.subject}</div>
                      <div className="meta">
                        <span className={`status-dot ${t.status.toLowerCase()}`} />
                        {t.status.charAt(0) + t.status.slice(1).toLowerCase()}
                      </div>
                    </div>

                    <div className="cat-col">
                      {t.aiCategory ? <Pill variant="brand">{t.aiCategory}</Pill> : <span style={{ color: "var(--text-muted)" }}>General</span>}
                    </div>
                    
                    <div className="pri-col">
                      <Pill variant={priorityVariant(t.priority)}>
                        {t.priority}
                      </Pill>
                    </div>

                    <div className="agent-col" style={{ color: "var(--text-muted)", fontSize: "13.5px" }}>
                      {t.assignedAgent?.name || "Unassigned"}
                    </div>

                    <div className="date-col">
                      {timeAgo(t.updatedAt)}
                    </div>
                  </Link>
                );
              })
            )}
          </Panel>
        </div>
      </div>
    </AppShell>
  );
}
