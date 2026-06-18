"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTour } from "./TourProvider";
import { TourVisualRenderer } from "./tour-visuals";

export function TourSlideshow() {
  const { phase, currentStep, currentStepIndex, totalSteps, next, prev, skip } =
    useTour();

  if (phase !== "touring" || !currentStep) return null;

  const isFirst = currentStepIndex === 0;
  const isLast = currentStepIndex === totalSteps - 1;
  const progress = ((currentStepIndex + 1) / totalSteps) * 100;

  return (
    <motion.div
      className="theme-dark fixed inset-0 z-[10001] flex isolate text-foreground"
      style={{ isolation: "isolate" }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="absolute inset-0 bg-[#060924]" />
      <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-bb-deep-ink)] via-[#0a0e33] to-[#0d1147]" />

      <div className="absolute top-0 left-0 right-0 h-1 bg-white/5 z-10">
        <motion.div
          className="h-full bg-[var(--color-bb-cyan)]"
          animate={{ width: `${progress}%` }}
          transition={{ type: "spring", stiffness: 150, damping: 20 }}
        />
      </div>

      <div className="relative z-10 flex flex-col lg:flex-row w-full h-full">
        {/* Left: Text content */}
        <div className="flex flex-col justify-center px-8 md:px-12 lg:px-16 py-8 lg:w-[42%] shrink-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStepIndex}
              initial={{ opacity: 0, x: -24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 24 }}
              transition={{ type: "spring", stiffness: 300, damping: 28 }}
              className="space-y-6"
            >
              <div>
                <motion.span
                  className="inline-block text-[10px] uppercase tracking-[0.2em] text-[var(--color-bb-cyan)] font-medium mb-3"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  Step {currentStepIndex + 1} of {totalSteps}
                </motion.span>

                <motion.h2
                  className="text-[clamp(1.5rem,3.5vw,2.5rem)] font-bold text-white leading-[1.15]"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                >
                  {currentStep.title}
                </motion.h2>
              </div>

              <motion.p
                className="text-base leading-relaxed text-white/50 max-w-[36ch]"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
              >
                {currentStep.description}
              </motion.p>

              <motion.div
                className="flex items-center gap-3 pt-4"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
              >
                {!isFirst && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-10 px-4 text-white/40 hover:text-white hover:bg-white/5 gap-2"
                    onClick={prev}
                  >
                    <ArrowLeft className="size-4" />
                    Back
                  </Button>
                )}
                <Button
                  variant="brand"
                  size="sm"
                  className="h-10 px-6 text-sm font-semibold gap-2"
                  onClick={next}
                >
                  {isLast ? "Finish tour" : "Next"}
                  {!isLast && <ArrowRight className="size-4" />}
                </Button>
              </motion.div>

              <motion.button
                onClick={skip}
                className="text-[11px] text-white/20 hover:text-white/40 transition-colors pt-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                Skip tour
              </motion.button>
            </motion.div>
          </AnimatePresence>

          {/* Step dots */}
          <div className="flex items-center gap-1.5 mt-auto pt-8">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div
                key={i}
                className={`h-1 rounded-full transition-all duration-300 ${
                  i === currentStepIndex
                    ? "w-6 bg-[var(--color-bb-cyan)]"
                    : i < currentStepIndex
                      ? "w-1.5 bg-white/20"
                      : "w-1.5 bg-white/8"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Right: Animated visual */}
        <div className="flex-1 flex items-center justify-center p-8 lg:p-12 relative overflow-hidden">
          {/* Ambient glow behind the visual */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-[var(--color-bb-cobalt)]/10 blur-[120px]" />
            <div className="absolute top-1/3 right-1/4 w-[300px] h-[300px] rounded-full bg-[var(--color-bb-cyan)]/5 blur-[100px]" />
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={currentStepIndex}
              className="relative z-10 w-full max-w-md"
              initial={{ opacity: 0, y: 24, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -24, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 250, damping: 24, delay: 0.1 }}
            >
              <TourVisualRenderer visual={currentStep.visual} />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Keyboard navigation hint */}
      <motion.div
        className="absolute bottom-4 right-6 flex items-center gap-3 text-[10px] text-white/15 z-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
      >
        <span className="flex items-center gap-1">
          <kbd className="px-1.5 py-0.5 rounded border border-white/10 bg-white/5 font-mono text-[9px]">←</kbd>
          <kbd className="px-1.5 py-0.5 rounded border border-white/10 bg-white/5 font-mono text-[9px]">→</kbd>
          Navigate
        </span>
        <span className="flex items-center gap-1">
          <kbd className="px-1.5 py-0.5 rounded border border-white/10 bg-white/5 font-mono text-[9px]">Esc</kbd>
          Skip
        </span>
      </motion.div>
    </motion.div>
  );
}
