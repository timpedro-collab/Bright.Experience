import type { TourConfig } from "./types";

export const adminTour: TourConfig = {
  welcomeTitle: "Welcome to the control room.",
  welcomeSubtitle:
    "Platform configuration, user management, and system oversight — the full picture, from one place.",
  celebrationTitle: "You're in control.",
  celebrationSubtitle: "Build something amazing.",
  celebrationCta: "Go to the pipeline",
  celebrationHref: "/pipeline",
  steps: [
    {
      target: null,
      visual: "task-checklist",
      title: "Your task board",
      description:
        "Tasks assigned to you across all events, sorted by urgency. Check them off and keep everything moving.",
    },
    {
      target: null,
      visual: "pipeline-kanban",
      title: "The pipeline",
      description:
        "Every event, every stage, every health status — the bird's-eye view of delivery across the entire platform.",
    },
    {
      target: null,
      visual: "settings-team",
      title: "User management",
      description:
        "Invite users, manage roles, activate and deactivate accounts. Full control over who has access to what.",
    },
    {
      target: null,
      visual: "event-glance",
      title: "Event workspace",
      description:
        "Click into any event for the full delivery workspace — every tab, every tool, every data point.",
    },
    {
      target: null,
      visual: "report-card",
      title: "Reports and benchmarks",
      description:
        "Generate proof-of-performance reports and track benchmark trends across event types.",
    },
    {
      target: null,
      visual: "command-search",
      title: "The power shortcut",
      description:
        "⌘K to jump to any admin page, any event, any user — faster than clicking through menus.",
    },
    {
      target: null,
      visual: "notifications",
      title: "System alerts",
      description:
        "Escalations, completions, and platform events — your operational feed keeps you on top of everything.",
    },
  ],
};
