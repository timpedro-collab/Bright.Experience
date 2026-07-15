/** Shared live projected-reach panel for quiz number/duration steps. */
"use client";

import type { LucideIcon } from "lucide-react";

export function ReachPreview({
  rows,
  note,
}: {
  rows: { icon: LucideIcon; label: string; value: string }[];
  note: string;
}) {

  return (
    <div className="rounded-[var(--radius-card)] border border-primary/20 bg-primary/[0.05] p-4">
      <p className="text-overline mb-2 text-primary">Projected reach</p>
      <div className="grid gap-2 sm:grid-cols-3">
        {rows.map((row) => {
          const Icon = row.icon;
          return (
            <div key={row.label} className="flex items-center gap-2">
              <Icon size={15} className="shrink-0 text-primary" aria-hidden />
              <span className="min-w-0">
                <span className="block text-sm font-semibold tabular-nums text-foreground">{row.value}</span>
                <span className="block text-[0.6875rem] leading-tight text-muted-foreground">{row.label}</span>
              </span>
            </div>
          );
        })}
      </div>
      <p className="mt-3 text-[0.6875rem] leading-snug text-muted-foreground">{note}</p>
    </div>
  );
}
