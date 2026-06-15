"use client";

import { useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import { TourProvider, useTour } from "./TourProvider";
import { TourWelcomeScreen } from "./TourWelcomeScreen";
import { TourSlideshow } from "./TourSlideshow";
import { TourCompleteScreen } from "./TourCompleteScreen";
import { getTourForRole } from "./tour-steps";
import type { UserRole } from "@/types";

interface TourShellProps {
  role: UserRole;
  autoStart: boolean;
  children: React.ReactNode;
}

export function TourShell({ role, autoStart, children }: TourShellProps) {
  return (
    <TourProvider>
      <TourAutoStarter role={role} autoStart={autoStart} />
      {children}
      <AnimatePresence>
        <TourWelcomeScreen />
      </AnimatePresence>
      <AnimatePresence>
        <TourSlideshow />
      </AnimatePresence>
      <AnimatePresence>
        <TourCompleteScreen />
      </AnimatePresence>
    </TourProvider>
  );
}

function TourAutoStarter({
  role,
  autoStart,
}: {
  role: UserRole;
  autoStart: boolean;
}) {
  const { start, beginSteps, phase } = useTour();

  useEffect(() => {
    if (phase !== "idle") return;

    const pending = localStorage.getItem("bright_tour_pending") === "true";
    if (pending) {
      localStorage.removeItem("bright_tour_pending");
      start(getTourForRole(role), role);
      setTimeout(() => beginSteps(), 100);
      return;
    }

    if (!autoStart) return;
    const key = `bright_tour_completed_${role}`;
    if (typeof window !== "undefined" && localStorage.getItem(key) === "true") {
      return;
    }
    const timer = setTimeout(() => {
      start(getTourForRole(role), role);
    }, 600);
    return () => clearTimeout(timer);
  }, [autoStart, role, start, beginSteps, phase]);

  return null;
}
