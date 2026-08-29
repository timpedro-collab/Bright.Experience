"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useModalOverlay } from "@/hooks/useModalOverlay";
import { useTour } from "./TourProvider";
import { completeOnboarding } from "@/app/actions/onboarding";

export function TourCompleteScreen() {
  const { phase, config, finish } = useTour();

  const overlayRef = useModalOverlay<HTMLDivElement>({
    active: phase === "celebration" && !!config,
    onClose: finish,
  });

  useEffect(() => {
    if (phase !== "celebration") return;
    completeOnboarding();
    import("canvas-confetti").then((mod) => {
      mod.default({
        particleCount: 200,
        spread: 140,
        startVelocity: 40,
        origin: { y: 0.55 },
        // canvas-confetti needs literal hex — these are the Ink brand tokens:
        // cobalt, accent cyan, soft cyan, white.
        colors: ["#183EF6", "#00BFE8", "#80ECFF", "#ffffff"],
      });
    });
  }, [phase]);

  if (phase !== "celebration" || !config) return null;

  return (
    <motion.div
      ref={overlayRef}
      role="dialog"
      aria-modal="true"
      aria-label={config.celebrationTitle}
      tabIndex={-1}
      className="theme-dark ink-glows fixed inset-0 z-[10000] flex items-center justify-center text-foreground outline-none"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Ink canvas + ambient corner glows — the deck's cinematic backdrop. */}
      <div className="absolute inset-0 bg-background" />

      <motion.div
        className="relative z-10 flex flex-col items-center text-center px-6 max-w-md"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 24, delay: 0.2 }}
      >
        <motion.svg
          viewBox="0 0 80 80"
          aria-hidden="true"
          className="size-20 mb-8"
          initial="hidden"
          animate="visible"
        >
          <circle
            cx="40"
            cy="40"
            r="36"
            fill="none"
            stroke="var(--color-brand-cyan)"
            strokeOpacity="0.15"
            strokeWidth="3"
          />
          <motion.circle
            cx="40"
            cy="40"
            r="36"
            fill="none"
            stroke="var(--color-brand-cyan)"
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
          className="text-3xl font-bold text-foreground"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          {config.celebrationTitle}
        </motion.h1>

        <motion.p
          className="mt-3 text-base text-muted-foreground"
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
