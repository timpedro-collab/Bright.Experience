/** Animated live counter card — displays a KPI with count-up animation and optional trend */
"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

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
  const [displayValue, setDisplayValue] = useState(0);
  const animationRef = useRef<number | null>(null);
  const startRef = useRef<number>(0);

  useEffect(() => {
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
  }, [value]);

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
          {displayValue.toLocaleString("en-US")}
          {suffix ? <span className="text-xl font-semibold">{suffix}</span> : null}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">{label}</p>
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
