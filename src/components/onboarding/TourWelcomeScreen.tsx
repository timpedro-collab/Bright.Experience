"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Sparkles, CalendarCheck, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useModalOverlay } from "@/hooks/useModalOverlay";
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
  const { phase, config, finish } = useTour();
  const router = useRouter();

  const overlayRef = useModalOverlay<HTMLDivElement>({
    active: phase === "welcome" && !!config,
    onClose: handleSkip,
  });

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
      ref={overlayRef}
      role="dialog"
      aria-modal="true"
      aria-label={config.welcomeTitle}
      tabIndex={-1}
      className="theme-dark ink-glows fixed inset-0 z-[10000] flex items-center justify-center text-foreground outline-none"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Ink canvas + ambient corner glows — the deck's cinematic backdrop. */}
      <div className="absolute inset-0 bg-background" />

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
              className="flex items-center justify-center size-12 rounded-xl border border-border bg-card"
              whileHover={{ scale: 1.08, rotate: 3 }}
            >
              <Icon className="size-5 text-brand-cyan" />
            </motion.div>
          ))}
        </motion.div>

        {/* The title animates in character by character, which a screen
            reader would otherwise spell out one letter at a time. */}
        <motion.h1
          className="text-[clamp(1.75rem,4vw,2.75rem)] font-bold text-foreground leading-tight"
          variants={itemVariants}
          aria-label={config.welcomeTitle}
        >
          {chars.map((c, i) => (
            <motion.span
              key={i}
              aria-hidden="true"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 + i * 0.03, duration: 0.05 }}
            >
              {c}
            </motion.span>
          ))}
        </motion.h1>

        <motion.p
          className="mt-4 text-base text-muted-foreground max-w-[42ch] leading-relaxed"
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
            className="text-muted-foreground/60 hover:text-muted-foreground text-sm"
            onClick={handleSkip}
          >
            Skip tour
          </Button>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
