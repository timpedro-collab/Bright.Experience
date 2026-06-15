"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

interface TaskViewToggleProps {
  eventId: string;
  currentView: "mine" | "all";
  myCount: number;
  allCount: number;
}

export function TaskViewToggle({
  eventId,
  currentView,
  myCount,
  allCount,
}: TaskViewToggleProps) {
  const base = `/events/${eventId}/actions`;

  return (
    <div className="inline-flex items-center rounded-lg border border-border/40 bg-card/50 p-0.5">
      <Link
        href={base}
        className={cn(
          "px-3 py-1.5 text-xs font-medium rounded-md transition-colors",
          currentView === "mine"
            ? "bg-[var(--color-bb-cobalt)] text-white"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        My tasks
        <span className="ml-1.5 tabular-nums opacity-80">{myCount}</span>
      </Link>
      <Link
        href={`${base}?view=all`}
        className={cn(
          "px-3 py-1.5 text-xs font-medium rounded-md transition-colors",
          currentView === "all"
            ? "bg-[var(--color-bb-cobalt)] text-white"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        All tasks
        <span className="ml-1.5 tabular-nums opacity-80">{allCount}</span>
      </Link>
    </div>
  );
}
