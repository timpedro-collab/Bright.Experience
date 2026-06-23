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
      target: "kpis",
      placement: "bottom",
      title: "Your portfolio at a glance",
      description:
        "Total events, how many are on track, what's at risk, and the tasks waiting on you — the health of your whole book in one row.",
    },
    {
      target: "needs-attention",
      placement: "top",
      title: "What needs a human now",
      description:
        "Blocked and at-risk events float to the top here, most urgent first. Start your day from this list.",
    },
    {
      target: "work-queue",
      placement: "bottom",
      title: "Your operational queue",
      description:
        "New quote requests, sign-offs, stuck customers — every pending item across the operation, each linking straight to where you act.",
    },
    {
      target: "nav:/admin/quotes",
      placement: "right",
      title: "Grow the book",
      description:
        "Your commercial surfaces — quotes, campaigns, partners and benchmarks — live in the rail, a click away whenever you need them.",
    },
    {
      target: "command-palette",
      placement: "bottom",
      title: "Jump anywhere instantly",
      description:
        "Press ⌘K from any screen to search events, people, or pages and jump there in one keystroke.",
    },
    {
      target: "nav:/pipeline",
      placement: "right",
      title: "Open your pipeline",
      description:
        "The whole portfolio on a kanban by delivery stage — drag to advance, spot what's stalling. This is your mission control.",
      action: {
        type: "click",
        hint: "Click Pipeline to open your board and finish the tour.",
        endsTour: true,
      },
    },
  ],
};
