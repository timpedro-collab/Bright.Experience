"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface CelebrationCheckProps {
  size?: number;
  className?: string;
  /** Only animate on mount when true. Static render otherwise (server-loaded items). */
  animate?: boolean;
  delay?: number;
}

export function CelebrationCheck({
  size = 18,
  className,
  animate: shouldAnimate = false,
  delay = 0,
}: CelebrationCheckProps) {
  const r = size * 0.42;
  const cx = size / 2;
  const cy = size / 2;

  if (!shouldAnimate) {
    return (
      <svg
        viewBox={`0 0 ${size} ${size}`}
        width={size}
        height={size}
        className={cn("shrink-0", className)}
      >
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <path
          d={`M${cx - r * 0.35} ${cy + r * 0.05} L${cx - r * 0.05} ${cy + r * 0.35} L${cx + r * 0.4} ${cy - r * 0.3}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  return (
    <motion.svg
      viewBox={`0 0 ${size} ${size}`}
      width={size}
      height={size}
      className={cn("shrink-0", className)}
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: "spring", stiffness: 500, damping: 22, delay }}
    >
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
        opacity="0.15"
      />
      <motion.circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.4, ease: "easeOut", delay: delay + 0.1 }}
      />
      <motion.path
        d={`M${cx - r * 0.35} ${cy + r * 0.05} L${cx - r * 0.05} ${cy + r * 0.35} L${cx + r * 0.4} ${cy - r * 0.3}`}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.3, ease: "easeOut", delay: delay + 0.35 }}
      />
    </motion.svg>
  );
}
