/**
 * Client filter bar that writes the selected value to a URL search param.
 *
 * Drop-in for the public catalog index pages — Server Component pages can
 * read the same param off `searchParams` to scope their query, so
 * deep-linked filters (eg `/catalog/packages?tier=premium`) work without
 * any client state outside of the URL.
 */
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

interface FilterOption {
  label: string;
  value: string; // "" = all
}

interface Props {
  param: string;
  options: FilterOption[];
  /** Optional aria-label for the container. */
  label?: string;
}

export function CatalogFilters({ param, options, label }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const active = searchParams.get(param) ?? "";

  function set(value: string) {
    const next = new URLSearchParams(searchParams);
    if (value) {
      next.set(param, value);
    } else {
      next.delete(param);
    }
    const qs = next.toString();
    router.push(qs ? `?${qs}` : "?", { scroll: false });
  }

  return (
    <div
      role="group"
      aria-label={label ?? "Filter"}
      className="flex flex-wrap gap-2"
    >
      {options.map((opt) => {
        const selected = active === opt.value;
        return (
          <button
            key={opt.value || "all"}
            type="button"
            onClick={() => set(opt.value)}
            aria-pressed={selected}
            className={cn(
              "rounded-full px-4 py-1.5 text-sm font-medium transition-all",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              selected
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-muted/40 text-muted-foreground hover:bg-accent hover:text-foreground"
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
