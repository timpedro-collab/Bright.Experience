import type { TourConfig } from "./types";

export const eventsLeadTour: TourConfig = {
  welcomeTitle: "Welcome to your command centre.",
  welcomeSubtitle:
    "You're the engine of delivery. Every event, every client, every milestone — orchestrated from here.",
  celebrationTitle: "You're ready to deliver brilliance.",
  celebrationSubtitle: "The pipeline awaits.",
  celebrationCta: "Go to my pipeline",
  celebrationHref: "/pipeline",
  steps: [
    {
      target: null,
      visual: "task-checklist",
      title: "Your work queue",
      description:
        "Every task assigned to you, grouped by event. Overdue items float to the top — nothing slips through. Check them off as you go.",
    },
    {
      target: null,
      visual: "pipeline-kanban",
      title: "The full pipeline",
      description:
        "See every event on a kanban board, grouped by delivery stage. Filter, spot bottlenecks, and keep delivery on track at a glance.",
    },
    {
      target: null,
      visual: "event-glance",
      title: "Dive into any event",
      description:
        "Click into an event for the full workspace — timeline, tasks, creative, logistics. Everything you need to manage delivery.",
    },
    {
      target: null,
      visual: "briefing-form",
      title: "Launch with the client",
      description:
        "The briefing captures brand goals and event details. It's the launchpad for every activation. Review and refine with the client.",
    },
    {
      target: null,
      visual: "approval-flow",
      title: "Push sign-offs forward",
      description:
        "Track approval status and chase outstanding items. Nothing ships without sign-off — and you can see exactly what's holding things up.",
    },
    {
      target: null,
      visual: "report-card",
      title: "Generate and publish",
      description:
        "Create proof-of-performance reports and publish them for clients. Beautiful reports with benchmarks and ROI insights.",
    },
    {
      target: null,
      visual: "notifications",
      title: "Mission control",
      description:
        "Escalations, completions, and client responses — your notification centre keeps you on top of everything.",
    },
    {
      target: null,
      visual: "command-search",
      title: "Jump anywhere instantly",
      description:
        "Press ⌘K to search events, navigate admin, or jump to any page in one keystroke.",
    },
  ],
};
