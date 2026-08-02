import { isPublicApiEnabled } from "@/lib/integration-flags";

import type { TourConfig, TourStep } from "./types";

/**
 * The keys-and-integrations stop only exists when the public API does — the
 * nav item it spotlights is hidden otherwise, and a tour pointing at nothing
 * reads as a broken product on someone's first five minutes.
 */
const apiStep: TourStep[] = isPublicApiEnabled()
  ? [
      {
        target: "nav:/admin/api",
        placement: "right",
        title: "Keys & integrations",
        description:
          "API keys and third-party integrations (like Pipedrive) — the platform's plumbing, all in one place.",
      },
    ]
  : [];

export const adminTour: TourConfig = {
  welcomeTitle: "Welcome to the control room.",
  welcomeSubtitle:
    "Users, configuration, and platform oversight — the whole picture from one seat.",
  celebrationTitle: "You're in control.",
  celebrationSubtitle: "Build something amazing.",
  celebrationCta: "Go to the pipeline",
  celebrationHref: "/pipeline",
  steps: [
    {
      target: "kpis",
      placement: "bottom",
      title: "The whole platform at a glance",
      description:
        "Every event in flight, on track, at risk, and live — the bird's-eye health of the entire operation.",
    },
    {
      target: "work-queue",
      placement: "bottom",
      title: "Everything in motion",
      description:
        "Quotes, reviews, customer-success and partner queues — every pending item across all teams, each a click from where it's actioned.",
    },
    {
      target: "nav:/admin/users",
      placement: "right",
      title: "Who has access",
      description:
        "Invite users, assign roles, and activate or deactivate accounts. You decide who sees what across the platform.",
    },
    ...apiStep,
    {
      target: "command-palette",
      placement: "bottom",
      title: "The power shortcut",
      description:
        "⌘K jumps to any admin page, event, or user — faster than any menu, from anywhere in the portal.",
    },
    {
      target: "nav:/pipeline",
      placement: "right",
      title: "The platform-wide pipeline",
      description:
        "Every event, every stage, every health flag — the full delivery picture, not just one team's slice.",
      action: {
        type: "click",
        hint: "Click Pipeline to see the whole operation and finish.",
        endsTour: true,
      },
    },
  ],
};
