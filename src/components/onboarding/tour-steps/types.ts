export type TourVisual =
  | "event-glance"
  | "task-checklist"
  | "notifications"
  | "command-search"
  | "settings-team"
  | "briefing-form"
  | "asset-upload"
  | "approval-flow"
  | "live-dashboard"
  | "report-card"
  | "pipeline-kanban"
  | "qa-checklist"
  | "logistics-timeline"
  | "studio-builds"
  | "partner-referral"
  | "partner-earnings";

export interface TourStep {
  target: string | null;
  title: string;
  description: string;
  placement?: "top" | "bottom" | "left" | "right";
  highlightPulse?: boolean;
  visual: TourVisual;
}

export interface TourConfig {
  welcomeTitle: string;
  welcomeSubtitle: string;
  celebrationTitle: string;
  celebrationSubtitle: string;
  celebrationCta: string;
  celebrationHref: string;
  steps: TourStep[];
}
