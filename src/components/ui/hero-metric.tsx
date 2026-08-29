/** HeroMetric — a single oversized KPI that anchors a dashboard. */
import * as React from "react";

import { cn } from "@/lib/utils";
import { AnimatedCounter } from "./motion";

interface HeroMetricProps {
  /** Short overline label, e.g. "On track" or "Pipeline" */
  label: string;
  /** Primary value — number animates, ReactNode renders as-is */
  value: React.ReactNode;
  /** Optional small descriptor under the value, e.g. "of 12 events" */
  hint?: string;
  /** Optional trailing emphasis, e.g. "/ 12" rendered at smaller weight */
  unit?: string;
  /** Optional trend chip */
  trend?: {
    direction: "up" | "down" | "flat";
    value: string;
    label?: string;
  };
  /** Visual tone — drives value colour */
  tone?: "default" | "success" | "warning" | "destructive" | "info";
  /** When true and `value` is numeric, count up on mount. Default true. */
  animate?: boolean;
  /** Inline metrics to render beneath the hero number as a quieter row */
  satellites?: React.ReactNode;
  className?: string;
}

const toneStyles: Record<NonNullable<HeroMetricProps["tone"]>, string> = {
  default: "text-foreground",
  success: "text-success",
  warning: "text-warning",
  destructive: "text-destructive",
  info: "text-info",
};

export function HeroMetric({
  label,
  value,
  hint,
  unit,
  trend,
  tone = "default",
  animate = true,
  satellites,
  className,
}: HeroMetricProps) {
  const numericValue = typeof value === "number" ? value : null;

  return (
    <div
      className={cn(
        "rounded-[var(--radius-card)] border border-border",
        "bg-card p-7 sm:p-8",
        className
      )}
    >
      <p className="text-overline text-muted-foreground">{label}</p>
      <div className="mt-3 flex items-baseline gap-3 flex-wrap">
        {animate && numericValue !== null ? (
          <AnimatedCounter
            value={numericValue}
            className={cn(
              "text-heading text-5xl sm:text-6xl font-bold tabular-nums tracking-tight leading-none",
              toneStyles[tone]
            )}
          />
        ) : (
          <span
            className={cn(
              "text-heading text-5xl sm:text-6xl font-bold tabular-nums tracking-tight leading-none",
              toneStyles[tone]
            )}
          >
            {value}
          </span>
        )}
        {unit && (
          <span className="text-2xl font-medium text-muted-foreground tabular-nums">
            {unit}
          </span>
        )}
        {trend && (
          <span
            className={cn(
              "text-xs tabular-nums",
              trend.direction === "up" && "text-success",
              trend.direction === "down" && "text-destructive",
              trend.direction === "flat" && "text-muted-foreground"
            )}
          >
            {trend.direction === "up" ? "▲" : trend.direction === "down" ? "▼" : "→"} {trend.value}
            {trend.label && (
              <span className="ml-1 text-muted-foreground">{trend.label}</span>
            )}
          </span>
        )}
      </div>
      {hint && (
        <p className="mt-2 text-sm text-muted-foreground">{hint}</p>
      )}
      {satellites && (
        <div className="mt-6 grid grid-cols-3 gap-6 border-t border-border pt-5">
          {satellites}
        </div>
      )}
    </div>
  );
}

interface HeroMetricSatelliteProps {
  label: string;
  value: React.ReactNode;
  tone?: "default" | "success" | "warning" | "destructive" | "info";
  animate?: boolean;
}

export function HeroMetricSatellite({
  label,
  value,
  tone = "default",
  animate = true,
}: HeroMetricSatelliteProps) {
  const numericValue = typeof value === "number" ? value : null;

  return (
    <div>
      <p className="text-overline text-muted-foreground">{label}</p>
      <div className="mt-1.5">
        {animate && numericValue !== null ? (
          <AnimatedCounter
            value={numericValue}
            className={cn(
              "text-heading text-xl font-semibold tabular-nums leading-none",
              toneStyles[tone]
            )}
          />
        ) : (
          <span
            className={cn(
              "text-heading text-xl font-semibold tabular-nums leading-none",
              toneStyles[tone]
            )}
          >
            {value}
          </span>
        )}
      </div>
    </div>
  );
}
