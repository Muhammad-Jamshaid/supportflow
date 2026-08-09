import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import AppShell from "@/app/components/AppShell";
import AdminSidebar from "@/app/components/AdminSidebar";
import StatCard from "@/app/components/StatCard";
import DarkModeToggle from "@/app/components/DarkModeToggle";

export default async function AdminPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  if (!session.user.isPlatformOwner) redirect("/dashboard");

  // Platform-wide queries
  const [
    totalCompanies,
    totalTickets,
    totalUsers,
    proCompanies
  ] = await Promise.all([
    prisma.company.count(),
    prisma.ticket.count(),
    prisma.user.count(),
    prisma.company.count({ where: { plan: "PRO" } })
  ]);

  return (
    <AppShell
      sidebar={
        <AdminSidebar activePath="/admin" adminName={session.user.name} />
      }
    >
      <div className="topbar">
        <h2>Platform Overview</h2>
        <div className="topbar-right">
          <DarkModeToggle />
        </div>
      </div>

      <div className="content">
        <div className="stats">
          <StatCard
            label="Total Companies"
            value={totalCompanies.toLocaleString()}
          />
          <StatCard
            label="Pro Companies"
            value={proCompanies.toLocaleString()}
          />
          <StatCard
            label="Total Tickets"
            value={totalTickets.toLocaleString()}
          />
          <StatCard
            label="Total Users"
            value={totalUsers.toLocaleString()}
          />
        </div>
      </div>
    </AppShell>
  );
}
