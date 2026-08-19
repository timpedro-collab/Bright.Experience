/**
 * Copy and templating for the sponsor-facing deck (`/pitch/informa/sponsor`).
 *
 * The audience is the exhibitor or sponsor an Informa rep is selling to:
 * no organizer economics, no rate-card ask, no splits. The deck templates
 * per show via search params (`?show=&dates=&attendees=&days=`) with
 * Connect Marketplace defaults, so one URL pattern serves every show.
 */

import { TAMPA_SHOW } from "@/lib/informa/content";

/** The per-show values that thread through every sponsor slide. */
export interface ShowConfig {
  show: string;
  dates: string;
  attendees: number;
  days: number;
}

/** Defaults: the Tampa flagship. */
export const DEFAULT_SHOW: ShowConfig = {
  show: TAMPA_SHOW.name,
  dates: TAMPA_SHOW.dates,
  attendees: 3_000,
  days: 3,
};

/** Clamps matching the configurator's levers, so preloads always land. */
export const SHOW_LIMITS = {
  attendees: { min: 500, max: 60_000 },
  days: { min: 1, max: 6 },
} as const;

function clampInt(
  raw: unknown,
  { min, max }: { min: number; max: number },
  fallback: number
): number {
  const n = Number(raw);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.round(n)));
}

function cleanText(raw: unknown, fallback: string): string {
  if (typeof raw !== "string") return fallback;
  const trimmed = raw.trim().slice(0, 80);
  return trimmed || fallback;
}

/**
 * Parse a show config from route search params. Unknown or out-of-range
 * values fall back to the Tampa defaults, so a mistyped link still renders
 * a coherent deck.
 */
export function parseShowConfig(
  params: Record<string, string | string[] | undefined>
): ShowConfig {
  const first = (v: string | string[] | undefined) =>
    Array.isArray(v) ? v[0] : v;
  return {
    show: cleanText(first(params.show), DEFAULT_SHOW.show),
    dates: cleanText(first(params.dates), DEFAULT_SHOW.dates),
    attendees: clampInt(
      first(params.attendees),
      SHOW_LIMITS.attendees,
      DEFAULT_SHOW.attendees
    ),
    days: clampInt(first(params.days), SHOW_LIMITS.days, DEFAULT_SHOW.days),
  };
}

/** Build the shareable per-show deck URL query for the rep's link. */
export function showConfigQuery(config: ShowConfig): string {
  const params = new URLSearchParams({
    show: config.show,
    dates: config.dates,
    attendees: String(config.attendees),
    days: String(config.days),
  });
  return params.toString();
}

/** Slide 2: what your stand could be. */
export const STAND_VISION = [
  {
    label: "The crowd",
    line: "A branded machine stops aisle traffic that signage never will. The queue is the billboard.",
  },
  {
    label: "The play",
    line: "Attendees put their hands on your brand for a scored game, not a flyer. Minutes of attention, not a glance.",
  },
  {
    label: "The reward",
    line: "Wins dispense your product, your merch, or your prize. Sampling, contact and brand story in one interaction.",
  },
] as const;

/** Slide 3: what one play creates, told as sponsor outcomes. */
export const SPONSOR_JOURNEY = [
  { step: "Attract", line: "The machine pulls the aisle to your space." },
  { step: "Play", line: "A fast branded game with your creative on every screen." },
  { step: "Opt in", line: "The badge scan starts it; the opt-in adds preferences and context a scan alone never carries." },
  { step: "Sample", line: "Wins dispense almost anything that fits: drinks, snacks, beauty, merch." },
  { step: "Follow up", line: "Your leads arrive opted in and scored, ready for your CRM, within 24 hours of close." },
] as const;

/** Slide 7: the report preview bullets next to the sample-report stats. */
export const REPORT_PROMISE = [
  "Plays, opted-in leads and cost per lead against the industry benchmark",
  "Engagement by hour, so you can see the placement working",
  "Every ad-loop content play logged on the machine, not estimated",
  "Sample and prize fulfilment reconciled to stock at close-out",
] as const;

/** Slide 8: how a sponsor locks a placement. */
export const SPONSOR_CLOSE = [
  {
    step: "Say yes to your rep",
    detail: "Your Informa rep confirms the placement and position on the floor plan.",
  },
  {
    step: "One creative call",
    detail: "Brand assets, game choice, and what the machine dispenses. About 30 minutes.",
  },
  {
    step: "We do the rest",
    detail: "Build, wrap, freight, install, on-site operation, teardown, and your report within 24 hours of close.",
  },
] as const;
