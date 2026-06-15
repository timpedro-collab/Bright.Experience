"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Rocket,
  Radio,
  CheckCircle2,
  ShieldCheck,
  Truck,
  BarChart3,
} from "lucide-react";
import { celebrateBig } from "@/lib/celebrate";
import type { Stage } from "@/types";

interface StageCelebrationProps {
  stage: Stage | null;
  onComplete: () => void;
}

const STAGE_CELEBRATIONS: Partial<
  Record<Stage, { icon: React.ElementType; headline: string; sub: string }>
> = {
  kickoff_complete: {
    icon: Rocket,
    headline: "Kickoff complete!",
    sub: "The brief is locked. Your team is springing into action.",
  },
  approvals: {
    icon: CheckCircle2,
    headline: "Assets approved!",
    sub: "Creative is locked in. Moving to build.",
  },
  qa_readiness: {
    icon: ShieldCheck,
    headline: "QA passed!",
    sub: "Everything checks out. Ready for delivery.",
  },
  logistics_confirmed: {
    icon: Truck,
    headline: "Logistics confirmed!",
    sub: "The machine is on its way. Almost showtime.",
  },
  event_live: {
    icon: Radio,
    headline: "You're live!",
    sub: "Your activation is running. Watch the data roll in.",
  },
  complete: {
    icon: BarChart3,
    headline: "Event complete!",
    sub: "What a run. Your report is being prepared.",
  },
};

const GENERIC = {
  icon: CheckCircle2,
  headline: "Stage advanced!",
  sub: "Your event just moved forward.",
};

export function StageCelebration({ stage, onComplete }: StageCelebrationProps) {
  const [visible, setVisible] = useState(!!stage);

  useEffect(() => {
    if (!stage) return;
    // Intentional: a new `stage` prop is an external trigger that must both
    // re-show the overlay and fire confetti, then auto-dismiss.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setVisible(true);
    celebrateBig();
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onComplete, 400);
    }, 3000);
    return () => clearTimeout(timer);
  }, [stage, onComplete]);

  const config = stage ? (STAGE_CELEBRATIONS[stage] ?? GENERIC) : GENERIC;
  const Icon = config.icon;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 z-[10001] flex items-center justify-center isolate"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="absolute inset-0 bg-[#060924]" />
          <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-bb-deep-ink)] via-[#0a0e33] to-[var(--color-bb-cobalt)]" />

          <motion.div
            className="relative z-10 flex flex-col items-center text-center px-6 max-w-md"
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 24, delay: 0.15 }}
          >
            <motion.div
              className="flex items-center justify-center size-20 rounded-2xl border border-white/10 bg-white/[0.04] mb-8"
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 400, damping: 20, delay: 0.2 }}
            >
              <Icon className="size-10 text-[var(--color-bb-cyan)]" />
            </motion.div>

            <motion.h1
              className="text-[clamp(1.75rem,4vw,2.75rem)] font-bold text-white leading-tight"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
            >
              {config.headline}
            </motion.h1>

            <motion.p
              className="mt-3 text-base text-white/50 max-w-[36ch]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              {config.sub}
            </motion.p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
