/** StatCard — uniform KPI tile used across dashboards. Optionally tappable. */
import * as React from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { cn } from "@/lib/utils";
import { StatCountUp } from "./StatCountUp";

interface StatCardProps {
  label: string;
  value: React.ReactNode;
  hint?: string;
  trend?: {
    direction: "up" | "down" | "flat";
    value: string;
    label?: string;
  };
  href?: string;
  icon?: React.ElementType;
  tone?: "default" | "success" | "warning" | "destructive" | "info";
  /** When true and `value` is numeric, count up on mount. */
  animate?: boolean;
  className?: string;
}

const toneStyles: Record<NonNullable<StatCardProps["tone"]>, string> = {
  default: "text-foreground",
  success: "text-success",
  warning: "text-warning",
  destructive: "text-destructive",
  info: "text-info",
};

const dotTones: Record<NonNullable<StatCardProps["tone"]>, string> = {
  default: "bg-muted-foreground/40",
  success: "bg-success",
  warning: "bg-warning",
  destructive: "bg-destructive",
  info: "bg-info",
};

export function StatCard({
  label,
  value,
  hint,
  trend,
  href,
  icon: Icon,
  tone = "default",
  animate = true,
  className,
}: StatCardProps) {
  const countUpRaw =
    typeof value === "number"
      ? String(value)
      : typeof value === "string" && value !== "—"
        ? value
        : null;
  const inner = (
    <>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {Icon ? (
            <Icon className={cn("size-4 text-muted-foreground", toneStyles[tone])} />
          ) : (
            <span className={cn("size-2 rounded-full", dotTones[tone])} aria-hidden />
          )}
          <span className="text-overline text-muted-foreground">{label}</span>
        </div>
        {href && (
          <ArrowUpRight
            className="size-3.5 text-muted-foreground/60 transition-colors group-hover:text-foreground"
            aria-hidden
          />
        )}
      </div>
      <div className="mt-3 flex items-baseline gap-2">
        {animate && countUpRaw !== null ? (
          <StatCountUp
            raw={countUpRaw}
            className={cn(
              "text-heading text-3xl font-bold tabular-nums tracking-tight",
              toneStyles[tone]
            )}
          />
        ) : (
          <span
            className={cn(
              "text-heading text-3xl font-bold tabular-nums tracking-tight",
              toneStyles[tone]
            )}
          >
            {value}
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
        <p className="mt-2 text-xs text-muted-foreground line-clamp-2">{hint}</p>
      )}
    </>
  );

  const baseClasses = cn(
    "group relative overflow-hidden rounded-[var(--radius-card)] border border-border",
    "bg-card/70 backdrop-blur-md",
    "p-5 transition-all duration-200",
    href &&
      "cursor-pointer hover:border-foreground/20 hover:bg-accent/50 hover:-translate-y-0.5 hover:shadow-[var(--bb-shadow-premium)]",
    className
  );

  if (href) {
    return (
      <Link
        href={href}
        className={cn(
          baseClasses,
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        )}
      >
        {inner}
      </Link>
    );
  }

  return <div className={baseClasses}>{inner}</div>;
}
