/**
 * Media-kit numbers for the Screen Ad Network section of the Informa
 * seller's kit: the measured funnel a slot buyer walks down and the
 * per-slot mechanics, all DERIVED from the sample report and the product
 * family so the kit can never contradict the report a sponsor is shown
 * next. Tests next to this file enforce the derivation.
 *
 * Compliance posture: every count here is a logged machine event (content
 * plays, completed sessions, opted-in leads) — nothing is modelled from
 * footfall, and nothing profiles attendees.
 */

import { productById } from "@/lib/informa/products";
import { reportTotals, SAMPLE_REPORT } from "@/lib/informa/sample-report";

/** Loop mechanics, anchored to the sample report and the rate card. */
export const AD_LOOP_MECHANICS = {
  /** 10-second slots in one rolling loop (same figure as the report). */
  slotsPerLoop: SAMPLE_REPORT.adLoop.slots,
  /** Seconds of screen time per slot play. */
  slotSeconds: 10,
  /** Rate-card band for one slot, per show. */
  retail: productById("loop").retail,
} as const;

/** One stage of the measured funnel, largest first. */
export interface AdFunnelStage {
  key: string;
  label: string;
  value: number;
  /** How the number is measured — the media buyer's "says who?" answer. */
  detail: string;
}

/**
 * The funnel from the sample show, every stage a logged event: loop
 * content plays, the completed hands-on sessions those screens sit
 * between, and the opted-in leads those sessions produced.
 */
export function adNetworkFunnel(): AdFunnelStage[] {
  const totals = reportTotals(SAMPLE_REPORT.byDay);
  return [
    {
      key: "loop-plays",
      label: "Loop content plays",
      value: SAMPLE_REPORT.adLoop.contentPlays,
      detail: "Every loop play is logged on the machine — measured, not modelled",
    },
    {
      key: "sessions",
      label: "Completed hands-on sessions",
      value: totals.plays,
      detail: "Badge-gated plays on the same machines the loop runs between",
    },
    {
      key: "leads",
      label: "Opted-in leads",
      value: totals.leads,
      detail: "Consent captured at the machine before play",
    },
  ];
}

export interface SlotMetrics {
  /** Logged creative plays one slot received across the sample show. */
  playsPerSlot: number;
  /** Whole minutes of pure brand screen time those plays add up to. */
  screenMinutesPerSlot: number;
  /** A slot's share of the loop, whole percent (sole-advertiser = 100). */
  shareOfVoicePct: number;
}

/** Per-slot delivery on the sample show, derived from the logged loop total. */
export function slotMetrics(): SlotMetrics {
  const { contentPlays, slots } = SAMPLE_REPORT.adLoop;
  const playsPerSlot = Math.round(contentPlays / slots);
  return {
    playsPerSlot,
    screenMinutesPerSlot: Math.round(
      (playsPerSlot * AD_LOOP_MECHANICS.slotSeconds) / 60,
    ),
    shareOfVoicePct: Math.round(100 / slots),
  };
}

/** Plain-language slot mechanics for the media-kit cards. */
export const SLOT_MECHANICS = [
  {
    title: "Where slots live",
    detail:
      "Only on machines the show controls: the rebooking engine on the organizer's booth and house media units in premium footfall spots. A machine sold to one sponsor carries that sponsor's brand alone — its screens are never in this inventory.",
  },
  {
    title: "How a slot runs",
    detail: `A rolling loop of ${AD_LOOP_MECHANICS.slotsPerLoop} ten-second slots plays between hands-on sessions. Buy one slot for a ${AD_LOOP_MECHANICS.slotsPerLoop === 6 ? "one-in-six" : "proportional"} share of voice, or take the whole loop and run sole-advertiser all show long.`,
  },
  {
    title: "What the advertiser sends",
    detail:
      "One 10-second vertical video (1080×1920). Bright.Blue handles scheduling, playout and the logged delivery counts in the post-show report.",
  },
] as const;
