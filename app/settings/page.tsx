import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  return (
    <main>
      <h1>Settings</h1>
      <p>User: {session.user.email}</p>
      <p>Company: {session.user.companyId}</p>
      <p>Settings panel will appear here. (Phase 2)</p>
    </main>
  );
}
