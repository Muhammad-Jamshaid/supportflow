"use client";

import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="data-mode" defaultTheme="system" enableSystem>
      <SessionProvider>{children}</SessionProvider>
      <Toaster 
        toastOptions={{
          style: {
            background: "var(--surface)",
            color: "var(--ink)",
            border: "1px solid var(--border)",
          },
        }}
      />
    </ThemeProvider>
  );
}
