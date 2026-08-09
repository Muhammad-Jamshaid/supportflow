import Link from "next/link";
import AppShell from "@/app/components/AppShell";
import Sidebar from "@/app/components/Sidebar";
import AdminSidebar from "@/app/components/AdminSidebar";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function NotFound() {
  let session = null;
  try {
    session = await getServerSession(authOptions);
  } catch {
    // Gracefully handle if session cannot be read during static rendering
  }

  let sidebarComponent = undefined;

  if (session) {
    if (session.user.isPlatformOwner) {
      sidebarComponent = <AdminSidebar activePath="" adminName={session.user.name} />;
    } else {
      sidebarComponent = (
        <Sidebar
          activePath=""
          userName={session.user.name || ""}
          userRole={session.user.role}
          companyName=""
        />
      );
    }
  }

  return (
    <AppShell sidebar={sidebarComponent}>
      <div className="content">
        <div className="empty-state">
          <div className="empty-icon">404</div>
          <h3>Page not found</h3>
          <p>The page you are looking for does not exist or has been moved.</p>
          <Link href={session ? "/dashboard" : "/"} className="btn btn-primary" style={{ marginTop: "16px" }}>
            Return to {session ? "Dashboard" : "Home"}
          </Link>
        </div>
      </div>
    </AppShell>
  );
}
