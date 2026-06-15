"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, CalendarCheck, FileText, Users } from "lucide-react";

const TYPED_TEXT = "summer fest";
const RESULTS = [
  { icon: CalendarCheck, label: "Summer Festival 2026", meta: "Event · O2 Arena", delay: 0 },
  { icon: FileText, label: "Summer Festival — Briefing", meta: "Document · Draft", delay: 0.08 },
  { icon: Users, label: "Summer Festival — Team", meta: "4 members", delay: 0.16 },
];

export function CommandSearch() {
  const [typed, setTyped] = useState("");
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    for (let i = 0; i <= TYPED_TEXT.length; i++) {
      timers.push(
        setTimeout(() => setTyped(TYPED_TEXT.slice(0, i)), 1000 + i * 80)
      );
    }
    timers.push(setTimeout(() => setShowResults(true), 1000 + TYPED_TEXT.length * 80 + 300));
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="w-full max-w-sm mx-auto">
      <motion.div
        className="rounded-2xl border border-white/10 bg-white/[0.04] overflow-hidden backdrop-blur-xl"
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
      >
        <div className="flex items-center gap-3 px-4 py-3 border-b border-white/5">
          <Search className="size-4 text-white/30" />
          <div className="flex-1 relative">
            <span className="text-sm text-white/80">{typed}</span>
            <motion.span
              className="inline-block w-[2px] h-4 bg-[var(--color-bb-cyan)] ml-[1px] align-middle"
              animate={{ opacity: [1, 0] }}
              transition={{ duration: 0.6, repeat: Infinity, repeatType: "reverse" }}
            />
          </div>
          <span className="text-[10px] text-white/20 border border-white/10 rounded px-1.5 py-0.5">
            ⌘K
          </span>
        </div>

        <AnimatePresence>
          {showResults && (
            <motion.div
              className="py-1"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 25 }}
            >
              {RESULTS.map((r, i) => {
                const Icon = r.icon;
                return (
                  <motion.div
                    key={r.label}
                    className={`flex items-center gap-3 px-4 py-2.5 ${i === 0 ? "bg-white/[0.04]" : ""}`}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: r.delay }}
                  >
                    <div className="flex items-center justify-center size-7 rounded-lg bg-white/[0.04]">
                      <Icon className="size-3.5 text-[var(--color-bb-cyan)]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-white/90 truncate">{r.label}</p>
                      <p className="text-[10px] text-white/35">{r.meta}</p>
                    </div>
                    {i === 0 && (
                      <motion.span
                        className="text-[9px] text-[var(--color-bb-cyan)] font-medium"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4 }}
                      >
                        Enter ↵
                      </motion.span>
                    )}
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
