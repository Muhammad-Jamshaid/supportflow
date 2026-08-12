import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import Link from "next/link";
import AppShell from "@/app/components/AppShell";
import Sidebar from "@/app/components/Sidebar";
import Panel from "@/app/components/Panel";
import DarkModeToggle from "@/app/components/DarkModeToggle";
import Avatar from "@/app/components/Avatar";
import EmptyState from "@/app/components/EmptyState";
export default async function CustomersPage({
  searchParams
}: {
  searchParams: { q?: string }
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  // Only Agent/Admin can access
  if (session.user.role === "CUSTOMER") {
    redirect("/dashboard");
  }

  const rawQ = (searchParams.q ?? "").trim();
  const qObj = rawQ ? {
    OR: [
      { name: { contains: rawQ, mode: Prisma.QueryMode.insensitive } },
      { email: { contains: rawQ, mode: Prisma.QueryMode.insensitive } }
    ]
  } : {};

  // Fetch customers
  const customers = await prisma.user.findMany({
    where: {
      role: "CUSTOMER",
      companyId: session.user.companyId,
      ...qObj
    },
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
      _count: {
        select: { submittedTickets: true }
      }
    },
    orderBy: { createdAt: "desc" }
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
        <h2>Customers</h2>
        <div className="topbar-right" style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <DarkModeToggle />
          <form method="GET" style={{ display: "flex", alignItems: "center" }}>
            <input 
              type="text" 
              name="q" 
              defaultValue={rawQ} 
              placeholder="Search customers..." 
              className="search"
            />
          </form>
        </div>
      </div>

      <div className="content">
        <Panel>
          {/* We use inline styles for the table grid to match the 4 columns: Avatar/Name, Email, Tickets, Customer Since */}
          <div className="trow head" style={{ gridTemplateColumns: "1fr 1fr 100px 150px" }}>
            <div>Customer</div>
            <div>Email</div>
            <div>Tickets</div>
            <div>Customer Since</div>
          </div>

          {customers.length === 0 ? (
            <div style={{ padding: "0 20px 20px" }}>
              <EmptyState
                icon={
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                }
                title={rawQ ? "No customers found" : "No customers yet"}
                description={rawQ ? "Try adjusting your search query." : "Customers will appear here when they sign up or are created."}
              />
            </div>
          ) : (
            customers.map(c => (
              <Link key={c.id} href={`/customers/${c.id}`} className="trow" style={{ gridTemplateColumns: "1fr 1fr 100px 150px", textDecoration: "none", color: "inherit", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <Avatar name={c.name || c.email} />
                  <strong style={{ color: "var(--ink)" }}>{c.name || "Unnamed"}</strong>
                </div>
                <div style={{ color: "var(--text)", fontSize: "13.5px" }}>{c.email}</div>
                <div style={{ color: "var(--text-muted)", fontSize: "13.5px" }}>{c._count.submittedTickets}</div>
                <div style={{ color: "var(--text-muted)", fontSize: "13.5px" }}>{new Date(c.createdAt).toLocaleDateString()}</div>
              </Link>
            ))
          )}
        </Panel>
      </div>
    </AppShell>
  );
}
