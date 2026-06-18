"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useTour } from "./TourProvider";
import { completeOnboarding } from "@/app/actions/onboarding";

export function TourCompleteScreen() {
  const { phase, config, finish } = useTour();

  useEffect(() => {
    if (phase !== "celebration") return;
    completeOnboarding();
    import("canvas-confetti").then((mod) => {
      mod.default({
        particleCount: 200,
        spread: 140,
        startVelocity: 40,
        origin: { y: 0.55 },
        colors: ["#2A3BB7", "#00D4FF", "#F5F0E8", "#ffffff"],
      });
    });
  }, [phase]);

  if (phase !== "celebration" || !config) return null;

  return (
    <motion.div
      className="theme-dark fixed inset-0 z-[10000] flex items-center justify-center text-foreground"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-bb-deep-ink)] via-[#0d1147] to-[var(--color-bb-cobalt)]" />

      <motion.div
        className="relative z-10 flex flex-col items-center text-center px-6 max-w-md"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 24, delay: 0.2 }}
      >
        <motion.svg
          viewBox="0 0 80 80"
          className="size-20 mb-8"
          initial="hidden"
          animate="visible"
        >
          <circle
            cx="40"
            cy="40"
            r="36"
            fill="none"
            stroke="rgba(0,212,255,0.15)"
            strokeWidth="3"
          />
          <motion.circle
            cx="40"
            cy="40"
            r="36"
            fill="none"
            stroke="var(--color-bb-cyan)"
            strokeWidth="3"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.6, ease: "easeOut", delay: 0.3 }}
          />
          <motion.path
            d="M26 42 L36 52 L56 30"
            fill="none"
            stroke="white"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.4, ease: "easeOut", delay: 0.7 }}
          />
        </motion.svg>

        <motion.h1
          className="text-3xl font-bold text-white"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          {config.celebrationTitle}
        </motion.h1>

        <motion.p
          className="mt-3 text-base text-white/60"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
        >
          {config.celebrationSubtitle}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="mt-10"
        >
          <Button
            asChild
            variant="brand"
            size="lg"
            className="px-8 text-sm font-semibold"
            onClick={finish}
          >
            <Link href={config.celebrationHref}>{config.celebrationCta}</Link>
          </Button>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
