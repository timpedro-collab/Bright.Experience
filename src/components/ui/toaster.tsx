/** Sonner-based toaster — mounted once in the root layout */
"use client";

import { Toaster as SonnerToaster } from "sonner";

import { useTheme } from "@/components/theme/ThemeProvider";

export function Toaster() {
  const { theme } = useTheme();
  return (
    <SonnerToaster
      theme={theme}
      position="bottom-right"
      richColors
      closeButton
      toastOptions={{
        classNames: {
          toast:
            "!font-[var(--font-body)] !rounded-[var(--radius-control)] !backdrop-blur-xl !border !shadow-[0_18px_40px_-22px_hsl(0,0%,0%,0.18)]",
          title: "!text-sm !font-medium",
          description: "!text-xs !text-muted-foreground",
        },
      }}
    />
  );
}
