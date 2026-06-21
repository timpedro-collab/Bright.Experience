import type { TourConfig } from "./types";

export const qaLeadTour: TourConfig = {
  welcomeTitle: "Welcome to quality control.",
  welcomeSubtitle:
    "You're the last line of defence before any activation goes live. Nothing ships without your stamp.",
  celebrationTitle: "Quality assured.",
  celebrationSubtitle: "Ship with confidence.",
  celebrationCta: "Go to my work",
  celebrationHref: "/",
  steps: [
    {
      target: null,
      visual: "qa-checklist",
      title: "Run the readiness gate",
      description:
        "Machine boot, game load, prize trigger, lead form, GDPR — work through every check systematically and watch readiness climb to 100%.",
    },
    {
      target: null,
      visual: "logistics-timeline",
      title: "Know what's arriving",
      description:
        "Check delivery status before your pass — exactly when each machine lands and where it's headed, so you test the right unit at the right time.",
    },
    {
      target: null,
      visual: "event-glance",
      title: "The full picture",
      description:
        "Open any event for the context behind the gate: configuration, creative, and history — everything you need to test against the brief.",
    },
    {
      target: null,
      visual: "task-checklist",
      title: "Your QA queue",
      description:
        "Every checklist and readiness gate awaiting your sign-off, grouped by priority so the urgent gates surface first.",
    },
    {
      target: null,
      visual: "notifications",
      title: "QA updates",
      description:
        "Failed items, completions, and gate changes — the moment they flip, you know.",
    },
    {
      target: null,
      visual: "command-search",
      title: "Straight to any gate",
      description:
        "⌘K takes you to the QA page of any event in a single keystroke.",
    },
  ],
};
