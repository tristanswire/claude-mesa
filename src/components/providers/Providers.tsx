"use client";

import { ToastProvider } from "@/components/ui/Toast";
import { ThemeProvider, type ThemePreference } from "./ThemeProvider";
import { ReactNode } from "react";

interface ProvidersProps {
  children: ReactNode;
  defaultTheme?: ThemePreference;
}

export function Providers({ children, defaultTheme = "system" }: ProvidersProps) {
  return (
    <ThemeProvider defaultTheme={defaultTheme}>
      <ToastProvider>{children}</ToastProvider>
    </ThemeProvider>
  );
}
