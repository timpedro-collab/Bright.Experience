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
    color: "text-[var(--color-bb-cyan)]",
  },
  {
    icon: Palette,
    title: "Brand skin — attract loop",
    status: "Review",
    progress: 100,
    color: "text-purple-400",
  },
  {
    icon: Layers,
    title: "Prize mechanic config",
    status: "Queued",
    progress: 0,
    color: "text-white/40",
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
        className="rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
      >
        <div className="px-5 py-3 border-b border-white/5 flex items-center justify-between">
          <span className="text-[10px] uppercase tracking-widest text-white/40">
            Studio queue
          </span>
          <span className="text-[10px] text-white/25">3 items</span>
        </div>

        <div className="divide-y divide-white/5">
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
                <div className="flex items-center justify-center size-8 rounded-lg bg-white/[0.04]">
                  <Icon className={`size-4 ${b.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-white/80 truncate">{b.title}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <div className="flex-1 h-1 rounded-full bg-white/5 overflow-hidden">
                      <motion.div
                        className="h-full rounded-full bg-[var(--color-bb-cyan)]"
                        initial={{ width: "0%" }}
                        animate={{ width: `${i === 0 ? activeProgress : b.progress}%` }}
                        transition={{ delay: 1 + i * 0.3, type: "spring", stiffness: 80 }}
                      />
                    </div>
                    <span className="text-[9px] text-white/30 tabular-nums shrink-0">
                      {b.progress}%
                    </span>
                  </div>
                </div>
                <span
                  className={`text-[8px] uppercase font-medium tracking-wider shrink-0 ${
                    b.status === "Review"
                      ? "text-amber-400"
                      : b.status === "In progress"
                        ? "text-[var(--color-bb-cyan)]"
                        : "text-white/25"
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
