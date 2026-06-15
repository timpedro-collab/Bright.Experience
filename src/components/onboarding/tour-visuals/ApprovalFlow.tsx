"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ThumbsUp, Shield } from "lucide-react";

export function ApprovalFlow() {
  const [phase, setPhase] = useState<"review" | "approving" | "approved">("review");

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("approving"), 2000);
    const t2 = setTimeout(() => setPhase("approved"), 3000);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  return (
    <div className="w-full max-w-sm mx-auto flex flex-col items-center gap-5">
      <motion.div
        className="w-full rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
      >
        <div className="aspect-[16/9] bg-gradient-to-br from-[var(--color-bb-cobalt)]/20 to-[var(--color-bb-cyan)]/10 flex items-center justify-center relative">
          <div className="grid grid-cols-3 gap-2 p-4 w-full">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <motion.div
                key={i}
                className="aspect-square rounded-lg bg-white/[0.06] border border-white/5"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 + i * 0.1 }}
              />
            ))}
          </div>
          <motion.div
            className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-[9px] font-medium border"
            animate={{
              backgroundColor:
                phase === "approved" ? "rgba(52,211,153,0.15)" : "rgba(251,191,36,0.15)",
              borderColor:
                phase === "approved" ? "rgba(52,211,153,0.3)" : "rgba(251,191,36,0.3)",
              color:
                phase === "approved" ? "rgb(52,211,153)" : "rgb(251,191,36)",
            }}
          >
            {phase === "approved" ? "Approved" : "Pending review"}
          </motion.div>
        </div>

        <div className="p-4 space-y-3">
          <div>
            <p className="text-xs font-semibold text-white/90">Screen designs v3</p>
            <p className="text-[10px] text-white/40 mt-0.5">Creative proof · 6 screens</p>
          </div>

          <AnimatePresence mode="wait">
            {phase === "review" && (
              <motion.div
                key="review"
                className="flex gap-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ delay: 0.8 }}
              >
                <button className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-[var(--color-bb-cobalt)] text-xs font-medium text-white/90">
                  <ThumbsUp className="size-3" />
                  Approve
                </button>
                <button className="flex-1 py-2 rounded-lg border border-white/10 text-xs text-white/50">
                  Request changes
                </button>
              </motion.div>
            )}
            {phase === "approving" && (
              <motion.div
                key="approving"
                className="flex items-center justify-center py-2.5"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <motion.div
                  className="size-5 border-2 border-[var(--color-bb-cyan)] border-t-transparent rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                />
              </motion.div>
            )}
            {phase === "approved" && (
              <motion.div
                key="approved"
                className="flex items-center justify-center gap-2 py-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: "spring", stiffness: 400 }}
              >
                <Shield className="size-4 text-emerald-400" />
                <span className="text-xs font-semibold text-emerald-400">Approved</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
