"use client";

import { useEffect, useState } from "react";

export default function DarkModeToggle() {
  const [dark, setDark] = useState(false);

  // Sync with what the theme-restore script may have already set
  useEffect(() => {
    setDark(document.documentElement.getAttribute("data-mode") === "dark");
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.setAttribute("data-mode", next ? "dark" : "light");
    try {
      localStorage.setItem("sf-theme", next ? "dark" : "light");
    } catch {}
  }

  return (
    <button
      id="theme-toggle"
      className="theme-toggle"
      onClick={toggle}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      title={dark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {dark ? "☀" : "●"}
    </button>
  );
}
