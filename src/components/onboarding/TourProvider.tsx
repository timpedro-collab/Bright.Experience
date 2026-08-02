"use client";

/**
 * TourProvider — phase and step state for the product tour.
 *
 * Keyboard handling deliberately lives with the overlays that render each
 * phase (see `useModalOverlay`), not here: a global listener fired alongside
 * the card's own one, so a single Arrow press advanced two steps and Enter on
 * the Back button both clicked it and moved forward.
 */

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { TourConfig, TourStep } from "./tour-steps/types";

type TourPhase = "idle" | "welcome" | "touring" | "celebration";

interface TourContextValue {
  phase: TourPhase;
  config: TourConfig | null;
  role: string | null;
  currentStepIndex: number;
  currentStep: TourStep | null;
  totalSteps: number;
  start: (config: TourConfig, role?: string) => void;
  next: () => void;
  prev: () => void;
  skip: () => void;
  beginSteps: () => void;
  finish: () => void;
}

const TourContext = createContext<TourContextValue | null>(null);

export function useTour() {
  const ctx = useContext(TourContext);
  if (!ctx) throw new Error("useTour must be used within TourProvider");
  return ctx;
}

export function TourProvider({ children }: { children: ReactNode }) {
  const [phase, setPhase] = useState<TourPhase>("idle");
  const [config, setConfig] = useState<TourConfig | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [stepIndex, setStepIndex] = useState(0);

  const start = useCallback((c: TourConfig, r?: string) => {
    setConfig(c);
    setRole(r ?? null);
    setStepIndex(0);
    setPhase("welcome");
  }, []);

  const beginSteps = useCallback(() => setPhase("touring"), []);

  const next = useCallback(() => {
    if (!config) return;
    if (stepIndex >= config.steps.length - 1) {
      setPhase("celebration");
    } else {
      setStepIndex((i) => i + 1);
    }
  }, [config, stepIndex]);

  const prev = useCallback(() => {
    setStepIndex((i) => Math.max(0, i - 1));
  }, []);

  const skip = useCallback(() => {
    setPhase("celebration");
  }, []);

  const finish = useCallback(() => {
    if (role) {
      localStorage.setItem(`bright_tour_completed_${role}`, "true");
    }
    setPhase("idle");
    setConfig(null);
    setRole(null);
    setStepIndex(0);
  }, [role]);

  const value = useMemo<TourContextValue>(
    () => ({
      phase,
      config,
      role,
      currentStepIndex: stepIndex,
      currentStep: config?.steps[stepIndex] ?? null,
      totalSteps: config?.steps.length ?? 0,
      start,
      next,
      prev,
      skip,
      beginSteps,
      finish,
    }),
    [phase, config, role, stepIndex, start, next, prev, skip, beginSteps, finish],
  );

  return <TourContext.Provider value={value}>{children}</TourContext.Provider>;
}
