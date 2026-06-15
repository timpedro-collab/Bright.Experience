"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Sparkles, CalendarCheck, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTour } from "./TourProvider";
import { completeOnboarding } from "@/app/actions/onboarding";

const ICONS = [CalendarCheck, Sparkles, BarChart3];

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.4 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 300, damping: 24 },
  },
};

export function TourWelcomeScreen() {
  const { phase, config, beginSteps, skip, finish } = useTour();
  const router = useRouter();

  if (phase !== "welcome" || !config) return null;

  async function handleLetsGo() {
    await completeOnboarding();
    localStorage.setItem("bright_tour_pending", "true");
    router.push("/");
  }

  async function handleSkip() {
    await completeOnboarding();
    finish();
    router.push("/");
  }

  const chars = config.welcomeTitle.split("");

  return (
    <motion.div
      className="fixed inset-0 z-[10000] flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-bb-deep-ink)] via-[#0d1147] to-[var(--color-bb-cobalt)]" />

      <motion.div
        className="relative z-10 flex flex-col items-center text-center px-6 max-w-lg"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        <motion.div className="flex gap-4 mb-8" variants={itemVariants}>
          {ICONS.map((Icon, i) => (
            <motion.div
              key={i}
              className="flex items-center justify-center size-12 rounded-xl border border-white/10 bg-white/[0.04]"
              whileHover={{ scale: 1.08, rotate: 3 }}
            >
              <Icon className="size-5 text-[var(--color-bb-cyan)]" />
            </motion.div>
          ))}
        </motion.div>

        <motion.h1
          className="text-[clamp(1.75rem,4vw,2.75rem)] font-bold text-white leading-tight"
          variants={itemVariants}
        >
          {chars.map((c, i) => (
            <motion.span
              key={i}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 + i * 0.03, duration: 0.05 }}
            >
              {c}
            </motion.span>
          ))}
        </motion.h1>

        <motion.p
          className="mt-4 text-base text-white/60 max-w-[42ch] leading-relaxed"
          variants={itemVariants}
        >
          {config.welcomeSubtitle}
        </motion.p>

        <motion.div className="flex gap-3 mt-10" variants={itemVariants}>
          <Button
            variant="brand"
            size="lg"
            className="px-8 text-sm font-semibold"
            onClick={handleLetsGo}
          >
            Let&apos;s go
          </Button>
          <Button
            variant="ghost"
            size="lg"
            className="text-white/40 hover:text-white/60 text-sm"
            onClick={handleSkip}
          >
            Skip tour
          </Button>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
