"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
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

  useEffect(() => {
    if (phase !== "touring") return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "ArrowRight" || e.key === "Enter") {
        e.preventDefault();
        next();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        prev();
      } else if (e.key === "Escape") {
        e.preventDefault();
        skip();
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [phase, next, prev, skip]);

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
