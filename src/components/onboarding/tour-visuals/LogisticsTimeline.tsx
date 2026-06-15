"use client";

import { motion } from "framer-motion";
import { Truck, Package, MapPin, Check } from "lucide-react";

const STEPS = [
  { icon: Package, label: "Machine packed", time: "Mon 12 Jun", done: true },
  { icon: Truck, label: "In transit", time: "Tue 13 Jun", active: true },
  { icon: MapPin, label: "Deliver to venue", time: "Wed 14 Jun", done: false },
  { icon: Check, label: "On-site confirmed", time: "Wed 14 Jun", done: false },
];

export function LogisticsTimeline() {
  return (
    <div className="w-full max-w-sm mx-auto">
      <motion.div
        className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
      >
        <p className="text-[10px] uppercase tracking-widest text-white/30 mb-4">
          Delivery tracking
        </p>

        <div className="relative ml-4">
          <div className="absolute left-0 top-2 bottom-2 w-px bg-white/10" />

          {STEPS.map((step, i) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={step.label}
                className="flex items-start gap-4 pb-5 last:pb-0 relative"
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + i * 0.3 }}
              >
                <div
                  className={`relative z-10 flex items-center justify-center size-7 rounded-full border ${
                    step.done
                      ? "bg-[var(--color-bb-cyan)]/15 border-[var(--color-bb-cyan)]/30"
                      : step.active
                        ? "bg-amber-500/15 border-amber-500/30"
                        : "bg-white/[0.03] border-white/10"
                  }`}
                  style={{ marginLeft: "-14px" }}
                >
                  <Icon
                    className={`size-3.5 ${
                      step.done
                        ? "text-[var(--color-bb-cyan)]"
                        : step.active
                          ? "text-amber-400"
                          : "text-white/30"
                    }`}
                  />
                  {step.active && (
                    <motion.div
                      className="absolute inset-0 rounded-full border border-amber-400/40"
                      animate={{ scale: [1, 1.6], opacity: [0.5, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    />
                  )}
                </div>
                <div className="flex-1 min-w-0 -mt-0.5">
                  <p className={`text-xs font-medium ${step.active ? "text-white/90" : step.done ? "text-white/60" : "text-white/35"}`}>
                    {step.label}
                  </p>
                  <p className="text-[10px] text-white/25 mt-0.5">{step.time}</p>
                </div>
                {step.done && (
                  <motion.span
                    className="text-[8px] text-emerald-400 font-medium uppercase mt-0.5"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 + i * 0.3 }}
                  >
                    Done
                  </motion.span>
                )}
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}
