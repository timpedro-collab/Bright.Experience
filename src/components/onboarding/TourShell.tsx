"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence } from "framer-motion";
import { TourProvider, useTour } from "./TourProvider";
import { TourWelcomeScreen } from "./TourWelcomeScreen";
import { TourSpotlight } from "./TourSpotlight";
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
      <TourSpotlight />
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
  const pathname = usePathname();
  // Spotlight steps only make sense where the real dashboard renders ("/").
  // On other hosts (e.g. /welcome) we only show the welcome intro, and the
  // "Let's go" CTA routes to "/" where the steps then run.
  const onDashboard = pathname === "/";

  useEffect(() => {
    if (phase !== "idle") return;

    const pending = localStorage.getItem("bright_tour_pending") === "true";
    if (pending) {
      localStorage.removeItem("bright_tour_pending");
      start(getTourForRole(role), role);
      // Let the dashboard paint (and its data-tour anchors mount) first.
      if (onDashboard) setTimeout(() => beginSteps(), 450);
      return;
    }

    if (!autoStart) return;

    // Deferred to the second login (UX subtraction audit): the first login
    // must show the customer their own data, not an overlay — the welcome
    // page is the real onboarding. We mark the first visit and only
    // auto-start the tour from the next visit onward. The explicit
    // `bright_tour_pending` request above bypasses this defer.
    const firstVisitKey = "bright_first_visit_done";
    if (localStorage.getItem(firstVisitKey) !== "true") {
      localStorage.setItem(firstVisitKey, "true");
      return;
    }

    const key = `bright_tour_completed_${role}`;
    if (typeof window !== "undefined" && localStorage.getItem(key) === "true") {
      return;
    }
    const timer = setTimeout(() => {
      start(getTourForRole(role), role);
    }, 600);
    return () => clearTimeout(timer);
  }, [autoStart, role, start, beginSteps, phase, onDashboard]);

  return null;
}
