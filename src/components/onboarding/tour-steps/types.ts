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

/**
 * A genuinely-completable action for a step. When present, the spotlight keeps
 * the highlighted element interactive (cuts a real hole in the scrim) and
 * advances the tour when the user actually performs it — so the tour teaches
 * by doing, not just showing.
 */
export interface TourAction {
  /** Interaction that completes the step. */
  type: "click";
  /** Short imperative nudge shown in the tooltip, e.g. "Press ⌘K to try it". */
  hint: string;
  /** If the action navigates away, mark the tour complete before it fires. */
  endsTour?: boolean;
}

export interface TourStep {
  /**
   * The element to spotlight. Either a `data-tour` key (e.g. "work-queue") or a
   * raw CSS selector (anything starting with `[`, `.`, or `#`). `null` renders a
   * centered card (intro / no-anchor fallback).
   */
  target: string | null;
  title: string;
  description: string;
  placement?: "top" | "bottom" | "left" | "right";
  highlightPulse?: boolean;
  /** Optional real interaction that advances the step (see TourAction). */
  action?: TourAction;
  /** Illustration shown when there's no target (or as a fallback). */
  visual?: TourVisual;
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
