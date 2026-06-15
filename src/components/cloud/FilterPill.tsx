/** Pill-styled filter / select trigger used in toolbars. */
"use client";

import * as React from "react";
import { ChevronDown, type LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { SURFACE_PILL } from "@/lib/surfaces";

export function FilterPill({
  label,
  icon: Icon,
  active,
  onClick,
  className,
}: {
  label: React.ReactNode;
  icon?: LucideIcon;
  active?: boolean;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex h-9 items-center gap-2 px-3.5 text-sm font-medium transition-colors",
        SURFACE_PILL,
        active
          ? "text-foreground ring-1 ring-primary/40"
          : "text-muted-foreground hover:text-foreground",
        className
      )}
    >
      {Icon ? <Icon className="h-4 w-4 opacity-70" /> : null}
      {label}
      <ChevronDown className="h-3.5 w-3.5 opacity-50" />
    </button>
  );
}

/** Segmented pill toggle (e.g. list/grid, dimension switches). */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  className,
}: {
  options: { value: T; label: React.ReactNode }[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-border bg-muted/60 p-1",
        className
      )}
    >
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={cn(
            "rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors",
            value === opt.value
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
