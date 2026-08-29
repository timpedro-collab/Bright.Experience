"use client";

import { motion } from "framer-motion";

// Stage tints follow the StatusBadge recipes: cobalt for in-flight work,
// warning for gates, info for build, success for live.
const COLUMNS = [
  {
    label: "Creative",
    color: "bg-primary/15 border-primary/30 text-primary",
    cards: [
      { name: "Pepsi Summer Bash", health: "green" },
    ],
  },
  {
    label: "Approvals",
    color: "bg-warning/15 border-warning/30 text-warning",
    cards: [
      { name: "Red Bull Campus", health: "amber" },
      { name: "Porsche Track Day", health: "green" },
    ],
  },
  {
    label: "Build",
    color: "bg-info/15 border-info/30 text-info",
    cards: [
      { name: "Costa Matcha Tour", health: "green" },
    ],
  },
  {
    label: "Live",
    color: "bg-success/15 border-success/30 text-success",
    cards: [
      { name: "Lucozade Uni Tour", health: "green" },
    ],
  },
];

const HEALTH: Record<string, string> = {
  green: "bg-success",
  amber: "bg-warning",
  red: "bg-destructive",
};

export function PipelineKanban() {
  return (
    <div className="w-full max-w-md mx-auto">
      <motion.div
        className="grid grid-cols-4 gap-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        {COLUMNS.map((col, ci) => (
          <motion.div
            key={col.label}
            className="space-y-2"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 + ci * 0.15 }}
          >
            <div className={`text-center text-[8px] uppercase tracking-widest font-medium py-1 rounded-md border ${col.color}`}>
              {col.label}
            </div>
            {col.cards.map((card, i) => (
              <motion.div
                key={card.name}
                className="rounded-lg border border-border bg-card p-2.5"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.7 + ci * 0.15 + i * 0.1, type: "spring" }}
                whileHover={{ y: -2, borderColor: "rgba(255,255,255,0.15)" }}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <span className={`size-1.5 rounded-full ${HEALTH[card.health]}`} />
                  <span className="text-[9px] text-foreground/75 font-medium truncate">{card.name}</span>
                </div>
                <div className="h-0.5 rounded-full bg-muted mt-1.5">
                  <motion.div
                    className="h-full rounded-full bg-brand-cyan/50"
                    initial={{ width: "0%" }}
                    animate={{ width: `${40 + ci * 15}%` }}
                    transition={{ delay: 1 + ci * 0.2, duration: 0.8 }}
                  />
                </div>
              </motion.div>
            ))}
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
