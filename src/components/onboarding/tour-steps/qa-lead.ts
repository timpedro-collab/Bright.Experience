import type { TourConfig } from "./types";

export const qaLeadTour: TourConfig = {
  welcomeTitle: "Welcome to quality control.",
  welcomeSubtitle:
    "You're the last line of defence before every activation goes live. Nothing ships without your stamp.",
  celebrationTitle: "Quality assured.",
  celebrationSubtitle: "Ship with confidence.",
  celebrationCta: "Go to my work",
  celebrationHref: "/",
  steps: [
    {
      target: null,
      visual: "task-checklist",
      title: "Your QA queue",
      description:
        "Every checklist item, every readiness gate, every event that needs your sign-off. Grouped by priority.",
    },
    {
      target: null,
      visual: "qa-checklist",
      title: "The QA checklist",
      description:
        "Machine boot, game load, prize trigger, lead form, GDPR — run through every item systematically. Check them off and watch readiness build.",
    },
    {
      target: null,
      visual: "logistics-timeline",
      title: "Pre-event context",
      description:
        "Check delivery status and readiness before running your QA pass. Know exactly when the machine arrives and where it's going.",
    },
    {
      target: null,
      visual: "notifications",
      title: "QA updates",
      description:
        "Checklist completions, failed items, and readiness gate changes — all delivered in real time.",
    },
    {
      target: null,
      visual: "command-search",
      title: "Jump to any event",
      description:
        "⌘K to navigate straight to the QA page of any event in one keystroke.",
    },
  ],
};
