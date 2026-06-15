import type { TourConfig } from "./types";

export const customerAdminTour: TourConfig = {
  welcomeTitle: "Welcome, boss.",
  welcomeSubtitle:
    "You're the captain of your account. Manage your team, approve deliverables, and track every event.",
  celebrationTitle: "Your account is ready.",
  celebrationSubtitle: "Time to make an impact.",
  celebrationCta: "Go to my events",
  celebrationHref: "/",
  steps: [
    {
      target: null,
      visual: "event-glance",
      title: "Your event at a glance",
      description:
        "Every activation gets its own dashboard. See the current stage, health status, and countdown — all in one place. You'll always know exactly where things stand.",
    },
    {
      target: null,
      visual: "task-checklist",
      title: "Clear your queue",
      description:
        "Tasks that need your attention appear as a live checklist. Upload assets, review proofs, approve deliverables — check them off and watch progress move forward in real time.",
    },
    {
      target: null,
      visual: "briefing-form",
      title: "Kick things off",
      description:
        "The briefing captures everything we need — your brand, your audience, your vision. Fill it out and our team springs into action. It auto-saves as you type.",
    },
    {
      target: null,
      visual: "asset-upload",
      title: "Supply your creative",
      description:
        "Your creative team produces the assets — screen designs, brand skins, hero images — to our sizing specs. Upload them here and our team reviews everything before build.",
    },
    {
      target: null,
      visual: "live-dashboard",
      title: "Watch the magic happen",
      description:
        "On event day, your dashboard lights up with real-time data. Plays, leads, conversion rates — all updating every 10 seconds. It's mesmerising to watch.",
    },
    {
      target: null,
      visual: "report-card",
      title: "Proof of performance",
      description:
        "After the event, get a beautiful report with benchmarks, ROI metrics, and shareable insights. Download as PDF or share a link directly with stakeholders.",
    },
    {
      target: null,
      visual: "notifications",
      title: "Stay in the loop",
      description:
        "Approvals, milestones, team requests — everything that matters arrives as a real-time notification. You'll never miss a beat.",
    },
    {
      target: null,
      visual: "settings-team",
      title: "Manage your people",
      description:
        "Add team members, control who has access, and assign roles. As the account admin, you decide who sees what across every event.",
    },
    {
      target: null,
      visual: "command-search",
      title: "Find anything instantly",
      description:
        "Press ⌘K anytime to search for events, tasks, people, or jump to any page. It's the fastest way to navigate — and it works from anywhere in the portal.",
    },
  ],
};
