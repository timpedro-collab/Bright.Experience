"use client";

import { motion } from "framer-motion";
import { CalendarCheck, MapPin } from "lucide-react";

const STAGES = [
  { label: "Confirmed", done: true },
  { label: "Kickoff", done: true },
  { label: "Creative", done: true },
  { label: "Approvals", active: true },
  { label: "Build", done: false },
  { label: "QA", done: false },
  { label: "Live", done: false },
];

export function EventGlance() {
  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-sm mx-auto">
      <motion.div
        className="w-full rounded-2xl border border-border bg-card p-6 space-y-5"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
      >
        <div className="flex items-start justify-between">
          <div>
            <motion.p
              className="text-[10px] uppercase tracking-widest text-brand-cyan mb-1"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              Featured event
            </motion.p>
            <motion.h3
              className="text-lg font-bold text-foreground"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
            >
              Summer Festival 2026
            </motion.h3>
            <motion.div
              className="flex items-center gap-2 mt-1 text-xs text-muted-foreground/60"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
            >
              <MapPin className="size-3" />
              <span>O2 Arena, London</span>
            </motion.div>
          </div>
          <motion.div
            className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-success/30 bg-success/15"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.8, type: "spring" }}
          >
            <span className="size-2 rounded-full bg-success animate-pulse" />
            <span className="text-xs font-medium text-success">On track</span>
          </motion.div>
        </div>

        <motion.div
          className="flex items-center gap-2 text-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
        >
          <CalendarCheck className="size-4 text-brand-cyan" />
          <motion.span
            className="text-muted-foreground tabular-nums"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
          >
            26d · 14h
          </motion.span>
        </motion.div>

        <div className="space-y-2">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground/50">Progress</p>
          <div className="flex gap-1">
            {STAGES.map((s, i) => (
              <motion.div
                key={s.label}
                className="flex-1 flex flex-col items-center gap-1"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.1 + i * 0.08 }}
              >
                <div
                  className={`h-1.5 w-full rounded-full ${
                    s.done
                      ? "bg-primary"
                      : s.active
                        ? // The active stage is the card's single gradient accent.
                          "chip-brand-gradient"
                        : "bg-secondary"
                  }`}
                />
                <span className={`text-[8px] ${s.active ? "text-foreground/80 font-medium" : "text-muted-foreground/50"}`}>
                  {s.label}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
