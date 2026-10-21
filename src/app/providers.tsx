"use client";

import { ThemeProvider } from "next-themes";

/** Theme switching (system by default) for the whole portal. */
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      {children}
    </ThemeProvider>
  );
}
