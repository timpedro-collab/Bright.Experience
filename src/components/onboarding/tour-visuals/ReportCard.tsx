"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Download, Share2, TrendingUp } from "lucide-react";

const METRICS = [
  { label: "Total plays", value: "4,812", trend: "+18% vs benchmark" },
  { label: "Leads captured", value: "1,247", trend: "+32% vs benchmark" },
  { label: "Avg. dwell time", value: "48s", trend: "+12% vs benchmark" },
  { label: "ROI estimate", value: "4.2x", trend: "Top quartile" },
];

export function ReportCard() {
  const [visibleMetrics, setVisibleMetrics] = useState(0);

  useEffect(() => {
    const timers = METRICS.map((_, i) =>
      setTimeout(() => setVisibleMetrics(i + 1), 1000 + i * 500)
    );
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
        <div className="px-5 py-4 border-b border-border/50">
          <motion.p
            className="text-[10px] uppercase tracking-widest text-brand-cyan mb-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            Post-event report
          </motion.p>
          <motion.h3
            className="text-sm font-bold text-foreground"
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
          >
            Summer Festival 2026
          </motion.h3>
          <motion.p
            className="text-[10px] text-muted-foreground/55 mt-0.5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
          >
            Performance summary · Generated 2 hours ago
          </motion.p>
        </div>

        <div className="p-4 space-y-0 divide-y divide-border/50">
          {METRICS.slice(0, visibleMetrics).map((m) => (
            <motion.div
              key={m.label}
              className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <div>
                <p className="text-[10px] text-muted-foreground/60">{m.label}</p>
                <p className="text-lg font-bold text-foreground tabular-nums mt-0.5">{m.value}</p>
              </div>
              <div className="flex items-center gap-1 text-success">
                <TrendingUp className="size-3" />
                <span className="text-[9px] font-medium">{m.trend}</span>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          className="flex gap-2 p-4 border-t border-border/50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 3.2 }}
        >
          {/* Primary CTA carries the brand gradient — the card's one accent. */}
          <button className="chip-brand-gradient flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium">
            <Download className="size-3" />
            Download PDF
          </button>
          <button className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-border text-xs text-muted-foreground">
            <Share2 className="size-3" />
          </button>
        </motion.div>
      </motion.div>
    </div>
  );
}
