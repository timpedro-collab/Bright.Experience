"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Circle, ArrowRight } from "lucide-react";

const TASKS = [
  { id: 1, label: "Upload brand guidelines", delay: 0 },
  { id: 2, label: "Review creative proof v2", delay: 0.6 },
  { id: 3, label: "Approve game mechanics", delay: 1.2 },
  { id: 4, label: "Confirm event logistics", delay: 1.8 },
];

export function TaskChecklist() {
  const [completed, setCompleted] = useState<number[]>([]);

  useEffect(() => {
    const timers = [
      setTimeout(() => setCompleted([1]), 2400),
      setTimeout(() => setCompleted([1, 2]), 3800),
    ];
    return () => timers.forEach(clearTimeout);
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
            Waiting on you
          </span>
          <motion.span
            className="text-xs tabular-nums font-medium"
            animate={{
              // framer-motion can't interpolate var() — literal accent cyan
              // (#00BFE8) and 50% white, matching the Ink tokens.
              color: completed.length >= 2 ? "rgba(0,191,232,1)" : "rgba(255,255,255,0.5)",
            }}
          >
            {completed.length}/{TASKS.length}
          </motion.span>
        </div>

        <ul className="divide-y divide-border/50">
          {TASKS.map((task) => {
            const isDone = completed.includes(task.id);
            return (
              <motion.li
                key={task.id}
                className="flex items-center gap-3 px-5 py-3.5"
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + task.delay * 0.4 }}
              >
                <AnimatePresence mode="wait">
                  {isDone ? (
                    <motion.div
                      key="done"
                      className="flex items-center justify-center size-5 rounded-full bg-primary"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 500, damping: 20 }}
                    >
                      <Check className="size-3 text-primary-foreground" strokeWidth={3} />
                    </motion.div>
                  ) : (
                    <motion.div key="open">
                      <Circle className="size-5 text-muted-foreground/30" />
                    </motion.div>
                  )}
                </AnimatePresence>
                <span
                  className={`flex-1 text-sm transition-all duration-500 ${
                    isDone ? "line-through text-muted-foreground/50" : "text-foreground/85"
                  }`}
                >
                  {task.label}
                </span>
                {!isDone && (
                  <ArrowRight className="size-3.5 text-primary" />
                )}
              </motion.li>
            );
          })}
        </ul>

        <motion.div
          className="px-5 py-3 border-t border-border/50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.5 }}
        >
          <div className="h-1 rounded-full bg-muted overflow-hidden">
            <motion.div
              className="h-full bg-primary rounded-full"
              initial={{ width: "0%" }}
              animate={{ width: `${(completed.length / TASKS.length) * 100}%` }}
              transition={{ type: "spring", stiffness: 100, damping: 20 }}
            />
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
