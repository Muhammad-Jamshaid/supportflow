import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  return (
    <main>
      <h1>Dashboard</h1>
      <p>Welcome, {session.user.name ?? session.user.email}</p>
      <p>Role: {session.user.role}</p>
      <p>Company ID: {session.user.companyId}</p>
      <nav>
        <ul>
          <li><a href="/tickets">Tickets</a></li>
          <li><a href="/admin">Admin</a></li>
          <li><a href="/settings">Settings</a></li>
        </ul>
      </nav>
    </main>
  );
}
