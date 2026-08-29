"use client";

import { motion } from "framer-motion";
import { Zap } from "lucide-react";
import { cn } from "@/lib/utils";

interface StreakIndicatorProps {
  streak: number;
  className?: string;
}

export function StreakIndicator({ streak, className }: StreakIndicatorProps) {
  if (streak <= 0) return null;

  return (
    <motion.div
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1",
        "bg-muted/40 border border-border/60",
        "text-xs font-medium tabular-nums",
        className
      )}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 400, damping: 22 }}
    >
      <motion.span
        animate={{
          rotate: [0, -12, 12, 0],
          scale: [1, 1.15, 1],
        }}
        transition={{
          duration: 1.2,
          ease: "easeInOut",
        }}
      >
        <Zap
          size={13}
          className={cn(
            "fill-current",
            streak >= 7
              ? "text-brand-cyan"
              : streak >= 3
                ? "text-warning"
                : "text-muted-foreground"
          )}
        />
      </motion.span>
      <span className="text-foreground">{streak}-day streak</span>
    </motion.div>
  );
}
