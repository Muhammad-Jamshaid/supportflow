import Link from "next/link";
import Avatar from "./Avatar";

interface AdminSidebarProps {
  activePath: string;
  adminName?: string | null;
}

const ADMIN_NAV = [
  { href: "/admin",           label: "Overview" },
  { href: "/admin/analytics", label: "Analytics" },
  { href: "/admin/companies", label: "Companies" },
  { href: "/admin/billing",   label: "Billing" },
  { href: "/admin/team",      label: "Team" },
];

export default function AdminSidebar({ activePath, adminName }: AdminSidebarProps) {
  return (
    <aside className="sidebar">
      <div className="logo" style={{ fontSize: "16px", marginBottom: "6px", padding: "0 8px" }}>
        <span className="mark" />
        SupportFlow
      </div>
      <div className="ws-switch">Platform admin ▾</div>

      <nav className="snav">
        {ADMIN_NAV.map(({ href, label }) => {
          const isActive = activePath === href;
          return (
            <Link key={href} href={href} className={isActive ? "active" : ""}>
              <span className="ico" />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="agent">
        <Avatar name={adminName} />
        <span>Admin · {adminName ?? "Admin"}</span>
      </div>
    </aside>
  );
}
