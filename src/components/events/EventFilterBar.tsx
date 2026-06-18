/** Client-side filter bar for the internal event grid — persists state in URL search params. */
"use client";

import { useCallback, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { STAGE_CONFIG } from "@/types";
import type { Stage, HealthStatus } from "@/types";
import { cn } from "@/lib/utils";

const STAGES = Object.entries(STAGE_CONFIG)
  .sort(([, a], [, b]) => a.order - b.order)
  .map(([key, val]) => ({ value: key as Stage, label: val.shortLabel }));

const HEALTH_OPTIONS: { value: HealthStatus | "all"; label: string }[] = [
  { value: "all", label: "All health" },
  { value: "green", label: "On Track" },
  { value: "amber", label: "At Risk" },
  { value: "red", label: "Blocked" },
];

interface EventFilterBarProps {
  /** Distinct customer account names to filter by. */
  accounts: string[];
  currentFilters: {
    q?: string;
    stage?: string;
    health?: string;
    account?: string;
  };
}

export function EventFilterBar({ accounts, currentFilters }: EventFilterBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const updateParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (!value || value === "all") {
        params.delete(key);
      } else {
        params.set(key, value);
      }
      params.delete("page");
      startTransition(() => {
        router.push(`/?${params.toString()}`);
      });
    },
    [router, searchParams, startTransition],
  );

  return (
    <div className="flex flex-wrap items-center gap-3 mb-6">
      <div className="relative flex-1 min-w-[200px] max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search events or accounts…"
          defaultValue={currentFilters.q ?? ""}
          onChange={(e) => updateParam("q", e.target.value)}
          className="pl-9"
        />
      </div>

      <select
        defaultValue={currentFilters.stage ?? "all"}
        onChange={(e) => updateParam("stage", e.target.value)}
        className={cn(
          "rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground",
        )}
      >
        <option value="all">All stages</option>
        {STAGES.map((s) => (
          <option key={s.value} value={s.value}>{s.label}</option>
        ))}
      </select>

      <select
        defaultValue={currentFilters.health ?? "all"}
        onChange={(e) => updateParam("health", e.target.value)}
        className="rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground"
      >
        {HEALTH_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>

      <select
        defaultValue={currentFilters.account ?? "all"}
        onChange={(e) => updateParam("account", e.target.value)}
        className="rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground"
      >
        <option value="all">All accounts</option>
        {accounts.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
    </div>
  );
}
