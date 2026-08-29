/** Compact footfall heat bars for experiential location cards. */
"use client";

import { cn } from "@/lib/utils";

export function FootfallHeat({ level }: { level: number }) {

  return (
    <span className="flex items-end gap-0.5" aria-hidden>
      {[1, 2, 3, 4].map((i) => (
        <span
          key={i}
          className={cn(
            "w-1.5 rounded-sm",
            i <= level ? "bg-primary" : "bg-muted-foreground/25"
          )}
          style={{ height: `${4 + i * 3}px` }}
        />
      ))}
    </span>
  );
}
