import type { TourConfig } from "./types";

export const eventsLeadTour: TourConfig = {
  welcomeTitle: "Welcome to your command centre.",
  welcomeSubtitle:
    "Every event, every client, every milestone — orchestrated from one board.",
  celebrationTitle: "You're ready to deliver brilliance.",
  celebrationSubtitle: "The pipeline awaits.",
  celebrationCta: "Go to my pipeline",
  celebrationHref: "/pipeline",
  steps: [
    {
      target: null,
      visual: "pipeline-kanban",
      title: "The whole pipeline, one board",
      description:
        "Every event on a kanban by delivery stage. Filter, scan, and see what's stalling at a glance — this is your mission control.",
    },
    {
      target: null,
      visual: "event-glance",
      title: "Dive into any event",
      description:
        "Click through to the full workspace: timeline, tasks, creative, logistics, reporting — every lever for delivery in one place.",
    },
    {
      target: null,
      visual: "briefing-form",
      title: "Launch with the client",
      description:
        "The briefing captures brand goals and event detail. Kick off each activation here and the whole delivery team springs into action.",
    },
    {
      target: null,
      visual: "approval-flow",
      title: "Push sign-offs forward",
      description:
        "See exactly what's awaiting approval and what's holding things up. Nothing ships without sign-off — your job is to keep it moving.",
    },
    {
      target: null,
      visual: "report-card",
      title: "Publish the proof",
      description:
        "Generate proof-of-performance reports with benchmarks and ROI, then publish and share them with the client.",
    },
    {
      target: null,
      visual: "task-checklist",
      title: "Your personal queue",
      description:
        "On top of the portfolio, the tasks assigned directly to you — overdue floating to the top so nothing slips.",
    },
    {
      target: null,
      visual: "notifications",
      title: "Mission control",
      description:
        "Escalations, completions, and client responses — your notification centre keeps you ahead of everything.",
    },
    {
      target: null,
      visual: "command-search",
      title: "⌘K everywhere",
      description:
        "Search events, people, or any page and jump there in one keystroke.",
    },
  ],
};
