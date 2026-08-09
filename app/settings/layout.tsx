import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import AppShell from "@/app/components/AppShell";
import Sidebar from "@/app/components/Sidebar";
import SettingsNav from "@/app/components/SettingsNav";
import DarkModeToggle from "@/app/components/DarkModeToggle";

export default async function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const company = await prisma.company.findUnique({
    where: { id: session.user.companyId },
    select: { name: true },
  });

  const isAdmin = session.user.role === "ADMIN";

  return (
    <AppShell
      sidebar={
        <Sidebar
          activePath="/settings"
          userName={session.user.name}
          userRole={session.user.role}
          companyName={company?.name}
        />
      }
    >
      <div className="topbar">
        <h2>Settings</h2>
        <div className="topbar-right">
          <DarkModeToggle />
        </div>
      </div>
      
      <SettingsNav isAdmin={isAdmin} />

      <div className="content">
        {children}
      </div>
    </AppShell>
  );
}
