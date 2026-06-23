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
      target: "kpis",
      placement: "bottom",
      title: "The fleet at a glance",
      description:
        "How many events are in flight, on track, at risk, and live right now — your delivery picture in one row.",
    },
    {
      target: "needs-attention",
      placement: "top",
      title: "Spot the bottleneck first",
      description:
        "Events flagged amber or red surface here, most urgent first. When delivery is at risk, you see it before anyone else.",
    },
    {
      target: "work-queue",
      placement: "bottom",
      title: "Your ops queue",
      description:
        "Logistics confirmations and on-the-ground actions across the operation, each linking straight to where you act.",
    },
    {
      target: "nav:/admin/locations",
      placement: "right",
      title: "Venues & delivery sites",
      description:
        "Access windows, power specs, and on-site contacts for every location — the brief before anyone rolls out.",
    },
    {
      target: "command-palette",
      placement: "bottom",
      title: "⌘K to anywhere",
      description:
        "Jump straight to any event's logistics page in a single keystroke — no clicking through menus.",
    },
    {
      target: "nav:/pipeline",
      placement: "right",
      title: "Track every build",
      description:
        "The pipeline groups events by delivery stage so you can shepherd builds and readiness gates end to end.",
      action: {
        type: "click",
        hint: "Click Pipeline to track your builds and finish the tour.",
        endsTour: true,
      },
    },
  ],
};
