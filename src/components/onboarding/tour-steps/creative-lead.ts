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
      target: null,
      visual: "approval-flow",
      title: "Approve or send back",
      description:
        "The heart of your day: review each asset against the spec, then approve it through to build — or return it with notes so the client can revise.",
    },
    {
      target: null,
      visual: "asset-upload",
      title: "What clients send you",
      description:
        "Logos, screen designs, brand skins, hero artwork — all uploaded to your sizing and aspect-ratio specs. Check quality before anything moves on.",
    },
    {
      target: null,
      visual: "studio-builds",
      title: "The Bright.Studio",
      description:
        "Bespoke design and animation requests, tracked from brief to delivery. Manage builds for game screens, brand skins, and configurations in one place.",
    },
    {
      target: null,
      visual: "task-checklist",
      title: "Your creative queue",
      description:
        "Every review, build, and proof across every event in one list — overdue items first, so nothing waits on you unnoticed.",
    },
    {
      target: null,
      visual: "notifications",
      title: "Your creative feed",
      description:
        "New uploads, revision requests, and approval decisions land the instant they happen — you're never the last to know.",
    },
    {
      target: null,
      visual: "command-search",
      title: "Navigate at speed",
      description:
        "⌘K jumps straight to asset reviews, studio orders, or any event page. The fastest way to work.",
    },
  ],
};
