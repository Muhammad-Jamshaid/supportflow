import Link from "next/link";
import Avatar from "./Avatar";
import NotificationBell from "./NotificationBell";
import UserDropdown from "./UserDropdown";

interface SidebarProps {
  activePath: string;
  userName?: string | null;
  userRole?: string | null;
  companyName?: string | null;
}

interface NavItem {
  href: string;
  label: string;
  /** true = renders as non-clickable span with Phase 2 tooltip */
  disabled?: boolean;
  /** roles that should NOT see this item at all (server-side still blocks access) */
  hideForRoles?: string[];
}

const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard",  label: "Dashboard"  },
  { href: "/tickets",    label: "Tickets"    },
  { href: "/customers",  label: "Customers", hideForRoles: ["CUSTOMER"] },
  { href: "/analytics",  label: "Analytics",  hideForRoles: ["CUSTOMER"] },
  { href: "/settings",   label: "Settings"   },
];

export default function Sidebar({
  activePath,
  userName,
  userRole,
  companyName,
}: SidebarProps) {
  const roleLabel =
    userRole === "ADMIN" ? "Admin" : userRole === "AGENT" ? "Agent" : "Customer";

  const visibleItems = NAV_ITEMS.filter(
    (item) => !item.hideForRoles?.includes(userRole ?? "")
  );

  return (
    <aside className="sidebar">
      <div className="logo" style={{ fontSize: "16px", marginBottom: "6px", padding: "0 8px" }}>
        <span className="mark" />
        SupportFlow
      </div>
      <div className="ws-switch">{companyName ?? "Your Workspace"} ▾</div>

      <nav className="snav">
        {visibleItems.map(({ href, label, disabled }) => {
          const isActive = activePath === href || activePath.startsWith(href + "/");

          if (disabled) {
            return (
              <span
                key={href}
                title="Coming in Phase 2"
                style={{
                  fontSize: "13.5px",
                  fontWeight: 500,
                  padding: "9px 10px",
                  borderRadius: "8px",
                  color: "var(--text-muted)",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  opacity: 0.45,
                  cursor: "not-allowed",
                  userSelect: "none",
                }}
              >
                <span className="ico" />
                {label}
              </span>
            );
          }

          return (
            <Link key={href} href={href} className={isActive ? "active" : ""}>
              <span className="ico" />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="agent">
        <UserDropdown>
          <Avatar name={userName} />
          <span>
            {userName ?? "User"} · {roleLabel}
          </span>
        </UserDropdown>
        <NotificationBell />
      </div>
    </aside>
  );
}
