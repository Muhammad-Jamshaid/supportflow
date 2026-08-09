"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function SettingsNav({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname();

  const tabs = [
    { href: "/settings", label: "Profile & Workspace" },
    ...(isAdmin ? [
      { href: "/settings/team", label: "Team" },
      { href: "/settings/billing", label: "Billing" },
    ] : [])
  ];

  return (
    <div className="settings-nav" style={{ 
      display: "flex", 
      gap: "20px", 
      borderBottom: "1px solid var(--border)", 
      marginBottom: "24px",
      padding: "0 18px"
    }}>
      {tabs.map(tab => (
        <Link
          key={tab.href}
          href={tab.href}
          style={{
            padding: "12px 0",
            fontWeight: 500,
            fontSize: "14px",
            color: pathname === tab.href ? "var(--ink)" : "var(--text-muted)",
            borderBottom: pathname === tab.href ? "2px solid var(--ink)" : "2px solid transparent",
            textDecoration: "none",
            marginBottom: "-1px"
          }}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  );
}
