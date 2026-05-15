/** Sonner-based toaster — mounted once in the root layout */
"use client";

import { Toaster as SonnerToaster } from "sonner";

export function Toaster() {
  return (
    <SonnerToaster
      theme="dark"
      position="bottom-right"
      richColors
      closeButton
      toastOptions={{
        classNames: {
          toast:
            "!font-[var(--font-body)] !rounded-[var(--radius-control)] !backdrop-blur-xl !border !shadow-[0_18px_40px_-22px_hsl(0,0%,0%,0.7)]",
          title: "!text-sm !font-medium",
          description: "!text-xs !text-muted-foreground",
        },
      }}
    />
  );
}
