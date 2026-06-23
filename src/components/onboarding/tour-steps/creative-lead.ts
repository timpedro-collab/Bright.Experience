import type { TourConfig } from "./types";

export const creativeLeadTour: TourConfig = {
  welcomeTitle: "Welcome to the studio.",
  welcomeSubtitle:
    "Assets, proofs, and bespoke builds — you're the creative engine behind every activation.",
  celebrationTitle: "Go make something extraordinary.",
  celebrationSubtitle: "Your review queue is waiting.",
  celebrationCta: "Open the studio",
  celebrationHref: "/studio",
  steps: [
    {
      target: "kpis",
      placement: "bottom",
      title: "The portfolio you create for",
      description:
        "Every live event and where it sits — context for the assets and builds landing in your queue.",
    },
    {
      target: "work-queue",
      placement: "bottom",
      title: "Where sign-offs pile up",
      description:
        "Asset reviews and studio orders waiting on the creative team surface here, each linking straight to the work.",
    },
    {
      target: "nav:/studio",
      placement: "right",
      title: "Bright.Studio build orders",
      description:
        "Bespoke design and animation requests, tracked brief-to-delivery — game screens, brand skins, configurations.",
    },
    {
      target: "nav:/admin/catalog",
      placement: "right",
      title: "Your product catalog",
      description:
        "Machines, games, packages and case studies — the building blocks you brand for every activation.",
    },
    {
      target: "command-palette",
      placement: "bottom",
      title: "Navigate at speed",
      description:
        "⌘K jumps straight to asset reviews, studio orders, or any event page from anywhere.",
    },
    {
      target: "nav:/admin/asset-reviews",
      placement: "right",
      title: "Clear your review queue",
      description:
        "Review each customer upload against the spec, then approve it through to build — or return it with notes.",
      action: {
        type: "click",
        hint: "Click Asset reviews to approve your first asset and finish.",
        endsTour: true,
      },
    },
  ],
};
