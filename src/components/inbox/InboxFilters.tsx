"use client";

/**
 * InboxFilters — client-side filter controls for `/inbox`.
 *
 * Each control is a native `<select>` styled to match the design
 * system. Changing any control pushes a fresh URL with merged params,
 * letting the inbox page stay a server component (no client task
 * fetching needed).
 *
 * Mirrors the canonical filter axes from the work-hub plan:
 *   - event (one specific event, or "all events")
 *   - category (creative / operations / qa / development / logistics /
 *     reporting / admin, or "all categories")
 *   - status ("open" = pending + in_progress + blocked, "recently
 *     completed" = window of last 14d, "all" = both)
 */

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

import type { TaskCategory } from "@/types";
import { cn } from "@/lib/utils";

export interface InboxEventOption {
  id: string;
  name: string;
  accountName: string | null;
}

interface InboxFiltersProps {
  events: InboxEventOption[];
  categories: TaskCategory[];
}

const STATUS_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "open", label: "Open" },
  { value: "recent", label: "Recently completed (14d)" },
  { value: "all", label: "Open + recent" },
];

const CATEGORY_LABELS: Record<TaskCategory, string> = {
  creative: "Creative",
  operations: "Operations",
  qa: "QA",
  development: "Development",
  logistics: "Logistics",
  reporting: "Reporting",
  admin: "Admin",
};

export function InboxFilters({ events, categories }: InboxFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  const event = searchParams.get("event") ?? "all";
  const category = searchParams.get("category") ?? "all";
  const status = searchParams.get("status") ?? "open";

  function updateParam(key: string, value: string) {
    const next = new URLSearchParams(searchParams.toString());
    if (value === "all" || (key === "status" && value === "open")) {
      next.delete(key);
    } else {
      next.set(key, value);
    }
    startTransition(() => {
      router.push(`/inbox${next.toString() ? `?${next.toString()}` : ""}`);
    });
  }

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-3 rounded-[var(--radius-card)] border border-border bg-card p-4",
        pending && "opacity-70"
      )}
    >
      <FilterSelect
        label="Event"
        value={event}
        onChange={(value) => updateParam("event", value)}
      >
        <option value="all">All events</option>
        {events.map((e) => (
          <option key={e.id} value={e.id}>
            {e.accountName ? `${e.accountName} · ` : ""}
            {e.name}
          </option>
        ))}
      </FilterSelect>

      <FilterSelect
        label="Category"
        value={category}
        onChange={(value) => updateParam("category", value)}
      >
        <option value="all">All categories</option>
        {categories.map((c) => (
          <option key={c} value={c}>
            {CATEGORY_LABELS[c]}
          </option>
        ))}
      </FilterSelect>

      <FilterSelect
        label="Status"
        value={status}
        onChange={(value) => updateParam("status", value)}
      >
        {STATUS_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </FilterSelect>
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
}) {
  return (
    <label className="flex items-center gap-2 text-xs text-muted-foreground">
      <span className="text-overline">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "h-9 rounded-[var(--radius-control)] border border-input bg-muted px-3 text-sm text-foreground",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        )}
      >
        {children}
      </select>
    </label>
  );
}
