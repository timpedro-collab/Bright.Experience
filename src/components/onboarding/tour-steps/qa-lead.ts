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
      target: "kpis",
      placement: "bottom",
      title: "What's heading your way",
      description:
        "Events in flight and how many are nearing the line — the gates that will need your stamp before they ship.",
    },
    {
      target: "needs-attention",
      placement: "top",
      title: "Catch risk before it ships",
      description:
        "At-risk events surface here first. If a gate is slipping, you'll see it before it becomes a go-live problem.",
    },
    {
      target: "work-queue",
      placement: "bottom",
      title: "Your QA queue",
      description:
        "Checklists and readiness gates awaiting your sign-off across the operation, each one a click from where you act.",
    },
    {
      target: "nav:/inbox",
      placement: "right",
      title: "Your task inbox",
      description:
        "Every check assigned to you in one stream, with the urgent gates floated to the top.",
    },
    {
      target: "command-palette",
      placement: "bottom",
      title: "Straight to any gate",
      description:
        "⌘K takes you to the QA page of any event in a single keystroke.",
    },
    {
      target: "nav:/pipeline",
      placement: "right",
      title: "Find what's nearing QA",
      description:
        "The pipeline shows every event by stage — spot the ones approaching readiness so you can line up your passes.",
      action: {
        type: "click",
        hint: "Click Pipeline to find events nearing QA and finish.",
        endsTour: true,
      },
    },
  ],
};
