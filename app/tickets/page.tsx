import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function TicketsPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  return (
    <main>
      <h1>Tickets</h1>
      <p>Company: {session.user.companyId}</p>
      <p>Ticket list will appear here. (Phase 2)</p>
    </main>
  );
}
