/**
 * Animated live counter card — displays a KPI with count-up animation,
 * a brand-tinted pulse when the value ticks up mid-session, and a
 * "since you opened" delta chip so change is visible without staring
 * at the number.
 */
"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

interface LiveCounterProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  trend?: number;
  className?: string;
  /** Unit appended to the value, e.g. "s" for seconds. */
  suffix?: string;
}

export function LiveCounter({
  label,
  value,
  icon,
  trend,
  className,
  suffix,
}: LiveCounterProps) {
  const reducedMotion = prefersReducedMotion();
  const [displayValue, setDisplayValue] = useState(() =>
    reducedMotion ? value : 0
  );
  const animationRef = useRef<number | null>(null);
  const startRef = useRef<number>(0);

  // Session baseline: what the metric read when this dashboard was opened.
  const baselineRef = useRef(value);
  const sessionDelta = value - baselineRef.current;

  // Pulse the number briefly whenever the value ticks up mid-session.
  const prevValueRef = useRef(value);
  const [pulsing, setPulsing] = useState(false);
  useEffect(() => {
    if (reducedMotion) {
      prevValueRef.current = value;
      return;
    }
    if (value > prevValueRef.current) {
      setPulsing(true);
      const t = setTimeout(() => setPulsing(false), 950);
      prevValueRef.current = value;
      return () => clearTimeout(t);
    }
    prevValueRef.current = value;
  }, [value, reducedMotion]);

  useEffect(() => {
    if (reducedMotion) return;

    const duration = 1200;
    const startTime = performance.now();
    startRef.current = displayValue;

    function animate(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(Math.round(startRef.current + (value - startRef.current) * eased));

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      }
    }

    animationRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, reducedMotion]);

  const shownValue = reducedMotion ? value : displayValue;

  return (
    <Card
      className={cn(
        "border-glass-border bg-surface-glass backdrop-blur-sm",
        className
      )}
    >
      <CardContent className="flex flex-col items-center justify-center p-6 text-center">
        <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10 text-brand">
          {icon}
        </div>
        <p className="text-heading text-3xl font-bold tabular-nums text-foreground">
          <span className={cn(pulsing && !reducedMotion && "live-value-pulse")}>
            {shownValue.toLocaleString("en-US")}
            {suffix ? <span className="text-xl font-semibold">{suffix}</span> : null}
          </span>
        </p>
        <p className="mt-1 text-sm text-muted-foreground">{label}</p>
        {sessionDelta > 0 && (
          <p className="mt-1.5 inline-flex items-center rounded-full bg-success/10 px-2 py-0.5 text-[0.65rem] font-semibold tabular-nums text-success">
            +{sessionDelta.toLocaleString("en-US")} since you opened
          </p>
        )}
        {trend !== undefined && (
          <p
            className={cn(
              "mt-2 text-xs font-medium tabular-nums",
              trend > 0 && "text-success",
              trend < 0 && "text-destructive",
              trend === 0 && "text-muted-foreground"
            )}
          >
            {trend > 0 ? "+" : ""}
            {trend}%
          </p>
        )}
      </CardContent>
    </Card>
  );
}
