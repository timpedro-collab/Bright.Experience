"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Circle, AlertTriangle } from "lucide-react";

const ITEMS = [
  { id: 1, label: "Machine power on", category: "Hardware" },
  { id: 2, label: "Game loads correctly", category: "Software" },
  { id: 3, label: "Prize trigger fires", category: "Software" },
  { id: 4, label: "Lead form submits", category: "Data" },
  { id: 5, label: "GDPR consent displays", category: "Compliance" },
  { id: 6, label: "Printer dispenses voucher", category: "Hardware" },
];

export function QaChecklist() {
  const [checked, setChecked] = useState<number[]>([]);

  useEffect(() => {
    const timers = [
      setTimeout(() => setChecked([1]), 1000),
      setTimeout(() => setChecked([1, 2]), 1800),
      setTimeout(() => setChecked([1, 2, 3]), 2600),
      setTimeout(() => setChecked([1, 2, 3, 4]), 3400),
    ];
    return () => timers.forEach(clearTimeout);
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
            QA readiness check
          </span>
          <motion.span
            className="text-xs tabular-nums font-medium text-white/50"
            key={checked.length}
          >
            {checked.length}/{ITEMS.length}
          </motion.span>
        </div>

        <ul className="divide-y divide-white/5">
          {ITEMS.map((item, i) => {
            const isDone = checked.includes(item.id);
            return (
              <motion.li
                key={item.id}
                className="flex items-center gap-3 px-5 py-2.5"
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + i * 0.08 }}
              >
                <AnimatePresence mode="wait">
                  {isDone ? (
                    <motion.div
                      key="done"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 500 }}
                    >
                      <CheckCircle2 className="size-4 text-emerald-400" />
                    </motion.div>
                  ) : (
                    <Circle key="open" className="size-4 text-white/20" />
                  )}
                </AnimatePresence>
                <span className={`flex-1 text-xs ${isDone ? "text-white/35 line-through" : "text-white/75"}`}>
                  {item.label}
                </span>
                <span className="text-[8px] uppercase tracking-wider text-white/20">
                  {item.category}
                </span>
              </motion.li>
            );
          })}
        </ul>

        <motion.div
          className="px-5 py-3 border-t border-white/5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 3.8 }}
        >
          <div className="flex items-center gap-2 text-[10px] text-amber-400/80">
            <AlertTriangle className="size-3" />
            <span>2 items remaining before go-live</span>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
