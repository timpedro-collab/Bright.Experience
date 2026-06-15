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
      target: null,
      visual: "event-glance",
      title: "Your event, front and centre",
      description:
        "This is your activation's home. See the stage, health status, and what's coming next — all at a glance. Your event is always one click away.",
    },
    {
      target: null,
      visual: "task-checklist",
      title: "What needs your attention",
      description:
        "Tasks waiting on you appear as a checklist. Complete them and watch progress update instantly. Every check moves your event one step closer to launch.",
    },
    {
      target: null,
      visual: "briefing-form",
      title: "Tell us your story",
      description:
        "The briefing is where the magic starts. Share your brand, your goals, and your vision — we'll bring it to life. It auto-saves every keystroke.",
    },
    {
      target: null,
      visual: "asset-upload",
      title: "Supply your creative",
      description:
        "Your creative team produces the assets to our sizing and aspect ratio specs. Upload screen designs, brand skins, and hero images — our team reviews and confirms everything before build.",
    },
    {
      target: null,
      visual: "live-dashboard",
      title: "Watch the magic happen",
      description:
        "On event day, the live tab lights up with real-time plays, leads, and interactions — updating every 10 seconds. It's mesmerising.",
    },
    {
      target: null,
      visual: "report-card",
      title: "The proof is in the numbers",
      description:
        "After the event, get a beautiful proof-of-performance report you can share with your entire team. Download as PDF or share a live link.",
    },
    {
      target: null,
      visual: "notifications",
      title: "We'll keep you in the loop",
      description:
        "Important updates, approvals, and milestones — they all land as notifications. You'll never miss a beat.",
    },
    {
      target: null,
      visual: "command-search",
      title: "Find anything fast",
      description:
        "Press ⌘K to search for events, tasks, or jump to any section instantly. The fastest way to get around.",
    },
  ],
};
