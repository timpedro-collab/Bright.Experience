import type { TourConfig } from "./types";

export const customerUserTour: TourConfig = {
  welcomeTitle: "Welcome to your experience.",
  welcomeSubtitle:
    "Everything about your activation — from briefing to results — lives right here.",
  celebrationTitle: "You're all set.",
  celebrationSubtitle: "Let's make something brilliant.",
  celebrationCta: "Go to my event",
  celebrationHref: "/",
  steps: [
    {
      target: "featured-event",
      visual: "event-glance",
      placement: "top",
      title: "Your event, front and centre",
      description:
        "Time to event, what needs you, the stage you're at, and your team — your activation's vitals in one glance.",
    },
    {
      target: "waiting-on-you",
      visual: "task-checklist",
      placement: "right",
      title: "What needs your attention",
      description:
        "Tasks waiting on you live here. Complete them and watch progress update instantly — every check moves your event closer to launch.",
    },
    {
      target: "notifications",
      visual: "notifications",
      placement: "bottom",
      title: "We'll keep you in the loop",
      description:
        "Updates, approvals, and milestones all land as notifications — you'll never miss a beat.",
    },
    {
      target: "command-palette",
      visual: "command-search",
      placement: "bottom",
      title: "Find anything fast",
      description:
        "Press ⌘K to search events, tasks, or jump to any section instantly.",
    },
    {
      target: "open-event",
      visual: "report-card",
      placement: "top",
      title: "Step inside your event",
      description:
        "Your full workspace — briefing, assets, the live dashboard on event day, and your proof-of-performance report after — all inside.",
      action: {
        type: "click",
        hint: "Click 'Open this event' to dive in and finish the tour.",
        endsTour: true,
      },
    },
  ],
};
