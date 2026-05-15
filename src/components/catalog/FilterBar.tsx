/** Horizontal filter bar with styled toggle buttons. */
"use client";

import { cn } from "@/lib/utils";

interface FilterBarProps {
  filters: { label: string; value: string }[];
  activeFilter: string;
  onFilterChange: (value: string) => void;
}

export function FilterBar({
  filters,
  activeFilter,
  onFilterChange,
}: FilterBarProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {filters.map((f) => (
        <button
          key={f.value}
          onClick={() => onFilterChange(f.value)}
          className={cn(
            "rounded-full px-4 py-1.5 text-sm font-medium transition-all",
            activeFilter === f.value
              ? "bg-primary text-primary-foreground shadow-sm"
              : "bg-secondary text-muted-foreground hover:bg-secondary/80 hover:text-foreground"
          )}
        >
          {f.label}
        </button>
      ))}
    </div>
  );
}
