/** Compact KPI tile + responsive grid wrapper. */
import * as React from "react";
import { ArrowDownRight, ArrowUpRight, type LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { GlassCard } from "./GlassCard";

export function KpiGrid({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4",
        className
      )}
    >
      {children}
    </div>
  );
}

export function KpiCard({
  label,
  value,
  delta,
  trend,
  icon: Icon,
  hint,
}: {
  label: string;
  value: React.ReactNode;
  delta?: string;
  trend?: "up" | "down" | "flat";
  icon?: LucideIcon;
  hint?: string;
}) {
  return (
    <GlassCard className="p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        {Icon ? (
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/15 text-primary">
            <Icon className="h-4 w-4" />
          </span>
        ) : null}
      </div>
      <div className="mt-3 text-3xl font-semibold tracking-tight text-foreground tabular-nums">
        {value}
      </div>
      {(delta || hint) && (
        <div className="mt-2 flex items-center gap-2 text-xs">
          {delta ? (
            <span
              className={cn(
                "inline-flex items-center gap-0.5 font-medium",
                trend === "down"
                  ? "text-destructive"
                  : trend === "flat"
                    ? "text-muted-foreground"
                    : "text-success"
              )}
            >
              {trend === "down" ? (
                <ArrowDownRight className="h-3.5 w-3.5" />
              ) : trend === "flat" ? null : (
                <ArrowUpRight className="h-3.5 w-3.5" />
              )}
              {delta}
            </span>
          ) : null}
          {hint ? <span className="text-muted-foreground/70">{hint}</span> : null}
        </div>
      )}
    </GlassCard>
  );
}
