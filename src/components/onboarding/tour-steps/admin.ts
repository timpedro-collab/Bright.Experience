import type { TourConfig } from "./types";

export const adminTour: TourConfig = {
  welcomeTitle: "Welcome to the control room.",
  welcomeSubtitle:
    "Users, configuration, and platform oversight — the whole picture from one seat.",
  celebrationTitle: "You're in control.",
  celebrationSubtitle: "Build something amazing.",
  celebrationCta: "Go to the pipeline",
  celebrationHref: "/pipeline",
  steps: [
    {
      target: null,
      visual: "settings-team",
      title: "Who has access",
      description:
        "Invite users, assign roles, and activate or deactivate accounts. You decide who sees what across the entire platform.",
    },
    {
      target: null,
      visual: "pipeline-kanban",
      title: "The platform-wide pipeline",
      description:
        "Every event, every stage, every health flag — the bird's-eye view across all delivery, not just one team's slice.",
    },
    {
      target: null,
      visual: "event-glance",
      title: "Full access to any event",
      description:
        "Open any workspace with complete access — every tab, every tool, every data point, with nothing gated off.",
    },
    {
      target: null,
      visual: "report-card",
      title: "Reports & benchmarks",
      description:
        "Generate proof-of-performance reports and track benchmark trends across event types and the wider portfolio.",
    },
    {
      target: null,
      visual: "command-search",
      title: "The power shortcut",
      description:
        "⌘K jumps to any admin page, event, or user — faster than any menu, from anywhere in the portal.",
    },
    {
      target: null,
      visual: "task-checklist",
      title: "Your task board",
      description:
        "Anything assigned to you across the platform, ordered by urgency so nothing waits.",
    },
    {
      target: null,
      visual: "notifications",
      title: "System alerts",
      description:
        "Escalations, completions, and platform events — your operational feed, in real time.",
    },
  ],
};
