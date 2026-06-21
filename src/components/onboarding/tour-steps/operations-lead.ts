import type { TourConfig } from "./types";

export const operationsLeadTour: TourConfig = {
  welcomeTitle: "Welcome to operations HQ.",
  welcomeSubtitle:
    "Deliveries, build schedules, and readiness gates — you keep every activation on the road and on time.",
  celebrationTitle: "Wheels up.",
  celebrationSubtitle: "Everything's moving. Let's deliver.",
  celebrationCta: "Go to my work",
  celebrationHref: "/",
  steps: [
    {
      target: null,
      visual: "logistics-timeline",
      title: "The delivery runway",
      description:
        "Packing, transport, on-site build, collection — every leg on one timeline. You'll always know where a machine is and what happens next.",
    },
    {
      target: null,
      visual: "event-glance",
      title: "Everything the crew needs",
      description:
        "Open any event for venue requirements, access windows, power specs, and the on-site contact — the full brief before anyone rolls out.",
    },
    {
      target: null,
      visual: "qa-checklist",
      title: "Readiness before you roll",
      description:
        "Confirm the machine boots, games load, and lead forms fire before sign-off. Ops and QA move in lock-step so nothing ships half-ready.",
    },
    {
      target: null,
      visual: "pipeline-kanban",
      title: "Spot the bottleneck first",
      description:
        "The pipeline flags every event amber or red. When delivery is at risk, you see it before anyone else — and jump in before it slips.",
    },
    {
      target: null,
      visual: "task-checklist",
      title: "Your ops queue",
      description:
        "Logistics confirmations and on-the-ground actions assigned to you, with overdue items floated to the top.",
    },
    {
      target: null,
      visual: "notifications",
      title: "Real-time logistics alerts",
      description:
        "Delivery confirmations, schedule changes, and readiness flips — the moment they happen, not the morning after.",
    },
    {
      target: null,
      visual: "command-search",
      title: "⌘K to anywhere",
      description:
        "Jump straight to any event's logistics page in a single keystroke — no clicking through menus.",
    },
  ],
};
