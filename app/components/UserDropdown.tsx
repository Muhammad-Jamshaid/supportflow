"use client";

import { useState, useRef, useEffect, ReactNode } from "react";
import { signOut } from "next-auth/react";

export default function UserDropdown({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dropdownStyle, setDropdownStyle] = useState<{ bottom: number; left: number }>({ bottom: 0, left: 0 });

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        (dropdownRef.current && dropdownRef.current.contains(event.target as Node)) ||
        (containerRef.current && containerRef.current.contains(event.target as Node))
      ) {
        return;
      }
      setIsOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleDropdown = () => {
    if (!isOpen && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setDropdownStyle({
        bottom: window.innerHeight - rect.top + 8,
        left: rect.left,
      });
    }
    setIsOpen(!isOpen);
  };

  return (
    <>
      <div 
        ref={containerRef}
        onClick={toggleDropdown}
        style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}
      >
        {children}
      </div>

      {isOpen && (
        <div
          ref={dropdownRef}
          style={{
            position: "fixed",
            bottom: dropdownStyle.bottom,
            left: dropdownStyle.left,
            width: "140px",
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "8px",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
            padding: "4px",
            zIndex: 9999,
          }}
        >
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            style={{
              background: "transparent",
              border: "none",
              padding: "8px 12px",
              textAlign: "left",
              fontSize: "13px",
              color: "var(--red)",
              cursor: "pointer",
              borderRadius: "4px",
              width: "100%",
            }}
            onMouseOver={(e) => (e.currentTarget.style.background = "color-mix(in srgb, var(--red) 10%, transparent)")}
            onMouseOut={(e) => (e.currentTarget.style.background = "transparent")}
          >
            Sign out
          </button>
        </div>
      )}
    </>
  );
}
