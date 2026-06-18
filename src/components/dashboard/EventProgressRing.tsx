"use client";

import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

interface EventProgressRingProps {
  completed: number;
  total: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
  showLabel?: boolean;
}

function ringColor(pct: number): string {
  if (pct >= 100) return "hsl(143, 72%, 42%)";
  if (pct >= 50) return "hsl(189, 100%, 75%)";
  return "rgba(255,255,255,0.3)";
}

export function EventProgressRing({
  completed,
  total,
  size = 48,
  strokeWidth = 3.5,
  className,
  showLabel = true,
}: EventProgressRingProps) {
  const prefersReduced = useReducedMotion();
  const pct = total > 0 ? Math.min(Math.round((completed / total) * 100), 100) : 0;
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - pct / 100);
  const color = ringColor(pct);

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-border"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: prefersReduced ? offset : circ }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: prefersReduced ? 0 : 1.2, ease: "easeOut" }}
        />
      </svg>
      {showLabel && (
        <span className="absolute text-[10px] font-semibold tabular-nums text-foreground">
          {pct}%
        </span>
      )}
    </div>
  );
}
