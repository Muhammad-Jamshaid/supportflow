import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function AdminPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  if (session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  return (
    <main>
      <h1>Admin</h1>
      <p>Company: {session.user.companyId}</p>
      <p>Admin panel will appear here. (Phase 2)</p>
    </main>
  );
}
