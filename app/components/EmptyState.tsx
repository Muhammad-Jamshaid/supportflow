import React from "react";

interface EmptyStateProps {
  title: string;
  description: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
  compact?: boolean;
}

export default function EmptyState({ title, description, action, icon, compact = false }: EmptyStateProps) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: compact ? "32px 16px" : "64px 24px",
        textAlign: "center",
        background: compact ? "transparent" : "var(--surface)",
        border: compact ? "none" : "1px dashed var(--border-strong)",
        borderRadius: "12px",
        marginTop: compact ? "0" : "16px",
      }}
    >
      {icon && (
        <div style={{ marginBottom: "16px", color: "var(--text-muted)", width: compact ? "32px" : "48px", height: compact ? "32px" : "48px" }}>
          {icon}
        </div>
      )}
      <h3 style={{ fontSize: "16px", fontWeight: 600, color: "var(--ink)", marginBottom: "8px" }}>
        {title}
      </h3>
      <p style={{ fontSize: "14px", color: "var(--text-muted)", maxWidth: "400px", marginBottom: action ? "24px" : "0", lineHeight: "1.5" }}>
        {description}
      </p>
      {action && <div>{action}</div>}
    </div>
  );
}
