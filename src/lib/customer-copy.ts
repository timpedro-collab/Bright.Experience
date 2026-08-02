/**
 * Customer-facing copy mapping.
 *
 * Internal stage/health labels are operational jargon ("QA & Readiness",
 * "Logistics Confirmed", "Blocked"). Customers should never see that language —
 * they see a calm, plain-English version of where their experience is in the
 * journey. This module is the single place that translation lives so every
 * customer surface stays consistent.
 *
 * Pure module (no server imports) — safe in client and server components.
 */
import type { Stage, HealthStatus } from "@/types";
import { STAGE_CONFIG, HEALTH_CONFIG } from "@/types";
import { daysUntilDate } from "@/lib/dates";

/** Plain-English stage labels + a short reassurance line for customers. */
const CUSTOMER_STAGE_COPY: Record<
  Stage,
  { label: string; shortLabel: string; description: string }
> = {
  confirmed: {
    label: "You're booked in",
    shortLabel: "Booked",
    description: "Your experience is confirmed. We'll guide you from here.",
  },
  kickoff_complete: {
    label: "Getting started",
    shortLabel: "Kickoff",
    description: "We've kicked things off and mapped out your delivery.",
  },
  creative_assets: {
    label: "Creative in progress",
    shortLabel: "Creative",
    description: "Your brand assets are being prepared for the experience.",
  },
  approvals: {
    label: "Ready for your approval",
    shortLabel: "Approvals",
    description: "Review the creative and give us the green light.",
  },
  build_configuration: {
    label: "We're building your game",
    shortLabel: "Build",
    description: "We're putting your experience together behind the scenes.",
  },
  qa_readiness: {
    label: "We're testing it",
    shortLabel: "Testing",
    description: "We're running through everything to make sure it's perfect on the day.",
  },
  logistics_confirmed: {
    label: "Delivery details locked in",
    shortLabel: "Delivery",
    description: "On-site details are locked in and ready for the day.",
  },
  event_live: {
    label: "Live now",
    shortLabel: "Live",
    description: "Your experience is live — watch it unfold in real time.",
  },
  reporting: {
    label: "Wrapping up",
    shortLabel: "Wrap-up",
    description: "We're pulling together your results and highlights.",
  },
  complete: {
    label: "All wrapped",
    shortLabel: "Wrapped",
    description: "Your experience is complete. Explore your results.",
  },
};

/** Customer-safe health labels — no "Blocked" jargon. */
const CUSTOMER_HEALTH_COPY: Record<HealthStatus, { label: string }> = {
  green: { label: "On track" },
  amber: { label: "In progress" },
  red: { label: "In progress" },
};

/**
 * Stage label for a viewer. Customers get the plain-English version;
 * internal roles keep the operational label.
 */
export function stageLabelFor(stage: Stage, isCustomer: boolean): string {
  return isCustomer
    ? CUSTOMER_STAGE_COPY[stage].label
    : STAGE_CONFIG[stage].label;
}

export function stageShortLabelFor(stage: Stage, isCustomer: boolean): string {
  return isCustomer
    ? CUSTOMER_STAGE_COPY[stage].shortLabel
    : STAGE_CONFIG[stage].shortLabel;
}

export function stageDescriptionFor(stage: Stage): string {
  return CUSTOMER_STAGE_COPY[stage].description;
}

/** Health label for a viewer — customers never see "Blocked". */
export function healthLabelFor(
  health: HealthStatus,
  isCustomer: boolean,
): string {
  return isCustomer
    ? CUSTOMER_HEALTH_COPY[health].label
    : HEALTH_CONFIG[health].label;
}

/** Minimal event shape needed to phrase the customer status line. */
type StatusLineEvent = {
  currentStage: Stage;
  eventDateStart: string;
  venueName?: string;
};

/**
 * One plain-English line that answers "where's my event?" for the customer:
 * the calm stage label plus a when/where clause, e.g.
 * "You're booked in · Live in 12 days at ExCeL London". Once the event has
 * been delivered we point them at their report instead of a countdown.
 * Single source of truth for the hero subtitle on home + overview.
 */
export function customerStatusLine(event: StatusLineEvent): string {
  const stageLabel = stageLabelFor(event.currentStage, true);

  if (event.currentStage === "reporting" || event.currentStage === "complete") {
    return `${stageLabel} · Your results are ready`;
  }

  const venue = event.venueName ?? "your venue";
  const days = daysUntilDate(event.eventDateStart);

  if (days > 0) {
    const unit = days === 1 ? "day" : "days";
    return `${stageLabel} · Live in ${days} ${unit} at ${venue}`;
  }
  if (days === 0) {
    return `${stageLabel} · Live today at ${venue}`;
  }
  return `${stageLabel} · Live now at ${venue}`;
}
