"use client";

import { useState } from "react";

interface AppShellProps {
  sidebar: React.ReactNode;
  children: React.ReactNode;
}

export default function AppShell({ sidebar, children }: AppShellProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="app">
      {/* Mobile topbar for hamburger */}
      <div className="mobile-header" style={{ display: "none" }}>
        <button 
          className="hamburger" 
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Toggle menu"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        </button>
        <span style={{ fontWeight: 600 }}>SupportFlow</span>
      </div>

      <div className={`app-sidebar-wrapper ${isOpen ? "open" : ""}`}>
        {sidebar}
      </div>

      {/* Overlay to close sidebar on mobile */}
      {isOpen && (
        <div 
          className="sidebar-overlay"
          onClick={() => setIsOpen(false)}
        />
      )}

      <div className="app-main">
        {children}
      </div>
    </div>
  );
}
