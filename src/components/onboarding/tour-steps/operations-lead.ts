import type { TourConfig } from "./types";

export const operationsLeadTour: TourConfig = {
  welcomeTitle: "Welcome to operations HQ.",
  welcomeSubtitle:
    "Delivery logistics, QA readiness, and on-the-ground coordination — all streamlined for you.",
  celebrationTitle: "Operations running smooth.",
  celebrationSubtitle: "Let's deliver.",
  celebrationCta: "Go to my work",
  celebrationHref: "/",
  steps: [
    {
      target: null,
      visual: "task-checklist",
      title: "Your ops queue",
      description:
        "Logistics confirmations, QA checklists, delivery schedules — everything waiting on you. Check items off as you complete them.",
    },
    {
      target: null,
      visual: "logistics-timeline",
      title: "Schedule and confirm",
      description:
        "Track every delivery from packing to on-site confirmation. The timeline shows you where things are and what's coming next.",
    },
    {
      target: null,
      visual: "qa-checklist",
      title: "Quality assurance",
      description:
        "The QA checklist ensures every machine boots, every game loads, and every lead form works. Systematic and thorough — nothing gets missed.",
    },
    {
      target: null,
      visual: "pipeline-kanban",
      title: "Spot bottlenecks early",
      description:
        "The pipeline shows every event's health at a glance. Amber and red flags mean you're needed — jump in before things slow down.",
    },
    {
      target: null,
      visual: "notifications",
      title: "Logistics alerts",
      description:
        "Delivery confirmations, QA completions, and schedule changes — all delivered in real time.",
    },
    {
      target: null,
      visual: "command-search",
      title: "Quick navigation",
      description:
        "⌘K to jump to any event, any logistics page, any admin tool instantly.",
    },
  ],
};
