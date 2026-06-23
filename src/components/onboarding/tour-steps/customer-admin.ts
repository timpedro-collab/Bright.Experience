import type { TourConfig } from "./types";

export const customerAdminTour: TourConfig = {
  welcomeTitle: "Welcome — you're running the show.",
  welcomeSubtitle:
    "You're the captain of your account. Manage your team, approve deliverables, and track every event.",
  celebrationTitle: "Your account is ready.",
  celebrationSubtitle: "Time to make an impact.",
  celebrationCta: "Go to my events",
  celebrationHref: "/",
  steps: [
    {
      target: "featured-event",
      visual: "event-glance",
      placement: "top",
      title: "Your account at a glance",
      description:
        "Time to event, what needs you, the stage, and your team size — the vitals of your live activation in one row.",
    },
    {
      target: "waiting-on-you",
      visual: "task-checklist",
      placement: "right",
      title: "Clear your queue",
      description:
        "Assets to upload, proofs to review, deliverables to approve — your decisions live here, and progress moves the moment you act.",
    },
    {
      target: "notifications",
      visual: "notifications",
      placement: "bottom",
      title: "Stay in the loop",
      description:
        "Approvals, milestones, and team requests arrive as real-time notifications — nothing slips past you.",
    },
    {
      target: "command-palette",
      visual: "command-search",
      placement: "bottom",
      title: "Find anything instantly",
      description:
        "Press ⌘K to search events, tasks, or people and jump anywhere in the portal.",
    },
    {
      target: "open-event",
      visual: "report-card",
      placement: "top",
      title: "Step inside your event",
      description:
        "The full workspace — briefing, creative sign-off, the live dashboard on the day, and your proof-of-performance report after.",
      action: {
        type: "click",
        hint: "Click 'Open this event' to dive in and finish the tour.",
        endsTour: true,
      },
    },
  ],
};
