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
import Select from "@/app/components/Select";

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

  async function handleCreate(formData: FormData) {
    "use server";
    const res = await createAgentTicketAction(formData);
    if (res.ok && res.ticketId) {
      redirect(`/tickets/${res.ticketId}`);
    } else {
      // Basic error handling for server action
      throw new Error(res.error || "Failed to create ticket");
    }
  }

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
              <form action={handleCreate} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                
                <label className="field">
                  <span className="lbl">Subject</span>
                  <input
                    type="text"
                    name="subject"
                    required
                    className="input"
                    placeholder="Brief description of the issue"
                  />
                </label>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                  <label className="field">
                    <span className="lbl">Customer</span>
                    <Select
                      name="customerId"
                      required
                      className="input fselect"
                      style={{ cursor: "pointer" }}
                    >
                      <option value="">Select a customer...</option>
                      {customers.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.name || c.email}
                        </option>
                      ))}
                    </Select>
                  </label>
                  <label className="field">
                    <span className="lbl">Priority</span>
                    <Select
                      name="priority"
                      required
                      className="input fselect"
                      defaultValue="NORMAL"
                      style={{ cursor: "pointer" }}
                    >
                      <option value="LOW">Low</option>
                      <option value="NORMAL">Normal</option>
                      <option value="HIGH">High</option>
                      <option value="URGENT">Urgent</option>
                    </Select>
                  </label>
                </div>

                <label className="field">
                  <span className="lbl">Initial Message</span>
                  <textarea
                    name="message"
                    required
                    rows={6}
                    className="input"
                    style={{ resize: "vertical" }}
                    placeholder="Describe the issue in detail..."
                  />
                </label>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "8px" }}>
                  <Link href="/tickets" className="btn btn-ghost">
                    Cancel
                  </Link>
                  <button type="submit" className="btn btn-primary">
                    Create Ticket
                  </button>
                </div>
              </form>
            </div>
          </Panel>
        </div>
      </div>
    </AppShell>
  );
}
