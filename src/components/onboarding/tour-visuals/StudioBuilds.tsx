"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Palette, Layers, Monitor } from "lucide-react";

const BUILDS = [
  {
    icon: Monitor,
    title: "Game screen design",
    status: "In progress",
    progress: 72,
    color: "text-brand-cyan",
  },
  {
    icon: Palette,
    title: "Brand skin — attract loop",
    status: "Review",
    progress: 100,
    color: "text-warning",
  },
  {
    icon: Layers,
    title: "Prize mechanic config",
    status: "Queued",
    progress: 0,
    color: "text-muted-foreground/60",
  },
];

export function StudioBuilds() {
  const [activeProgress, setActiveProgress] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setActiveProgress(72), 800);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="w-full max-w-sm mx-auto">
      <motion.div
        className="rounded-2xl border border-border bg-card overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
      >
        <div className="px-5 py-3 border-b border-border/50 flex items-center justify-between">
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground/60">
            Studio queue
          </span>
          <span className="text-[10px] text-muted-foreground/40">3 items</span>
        </div>

        <div className="divide-y divide-border/50">
          {BUILDS.map((b, i) => {
            const Icon = b.icon;
            return (
              <motion.div
                key={b.title}
                className="flex items-center gap-3 px-5 py-3.5"
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + i * 0.2 }}
              >
                <div className="flex items-center justify-center size-8 rounded-lg bg-secondary">
                  <Icon className={`size-4 ${b.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground/85 truncate">{b.title}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <div className="flex-1 h-1 rounded-full bg-muted overflow-hidden">
                      <motion.div
                        className="h-full rounded-full bg-primary"
                        initial={{ width: "0%" }}
                        animate={{ width: `${i === 0 ? activeProgress : b.progress}%` }}
                        transition={{ delay: 1 + i * 0.3, type: "spring", stiffness: 80 }}
                      />
                    </div>
                    <span className="text-[9px] text-muted-foreground/50 tabular-nums shrink-0">
                      {b.progress}%
                    </span>
                  </div>
                </div>
                <span
                  className={`text-[8px] uppercase font-medium tracking-wider shrink-0 ${
                    b.status === "Review"
                      ? "text-warning"
                      : b.status === "In progress"
                        ? "text-brand-cyan"
                        : "text-muted-foreground/40"
                  }`}
                >
                  {b.status}
                </span>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}
