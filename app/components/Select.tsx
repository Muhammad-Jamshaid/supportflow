import React, { SelectHTMLAttributes } from "react";

export default function Select({ className = "", style = {}, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <select
        className={className}
        style={{
          appearance: "none",
          background: "var(--surface)",
          border: "1px solid var(--border)",
          color: "var(--text)",
          paddingRight: "32px", // Space for chevron
          ...style
        }}
        {...props}
      >
        {children}
      </select>
      <div 
        style={{
          position: "absolute",
          right: "12px",
          top: "50%",
          transform: "translateY(-50%)",
          pointerEvents: "none",
          color: "var(--text-muted)",
          display: "flex",
          alignItems: "center"
        }}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </div>
    </div>
  );
}
