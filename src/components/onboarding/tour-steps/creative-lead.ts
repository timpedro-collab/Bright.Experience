import type { TourConfig } from "./types";

export const creativeLeadTour: TourConfig = {
  welcomeTitle: "Welcome to your studio.",
  welcomeSubtitle:
    "You're the creative engine. Assets, proofs, studio builds — your workspace is designed for making beautiful things.",
  celebrationTitle: "Go make something extraordinary.",
  celebrationSubtitle: "Your creative queue awaits.",
  celebrationCta: "Go to my work",
  celebrationHref: "/",
  steps: [
    {
      target: null,
      visual: "task-checklist",
      title: "Your creative queue",
      description:
        "Every creative task across every event — asset reviews, studio builds, proof approvals — all here. Check them off as you deliver.",
    },
    {
      target: null,
      visual: "studio-builds",
      title: "The Bright.Studio",
      description:
        "Manage studio requests, review builds, and deliver creative that makes clients say wow. Track progress on game screens, brand skins, and configurations.",
    },
    {
      target: null,
      visual: "asset-upload",
      title: "Review client uploads",
      description:
        "Clients upload screen designs, brand skins, and hero images to spec. Review what they send — check sizing, aspect ratios, and brand quality.",
    },
    {
      target: null,
      visual: "approval-flow",
      title: "Approve or send back",
      description:
        "Review each asset against the spec. If it meets the bar, approve it and it moves to build. If not, send it back with notes and the client revises.",
    },
    {
      target: null,
      visual: "notifications",
      title: "Creative updates",
      description:
        "Revision requests, new uploads, approval decisions — your creative feed keeps you in the loop on everything that matters.",
    },
    {
      target: null,
      visual: "command-search",
      title: "Navigate at speed",
      description:
        "⌘K jumps you anywhere — studio orders, asset reviews, any event page. The fastest way to work.",
    },
  ],
};
