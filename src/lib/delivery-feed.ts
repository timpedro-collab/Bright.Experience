/**
 * Delivery feed + staged pre-event reveals for the customer portal.
 *
 * The "labor illusion" surfaces: while Bright.Blue is building, wrapping and
 * shipping, the customer sees the work happening ("Machine wrapped ✓ · QA'd
 * ✓ · In transit"), and gets time-gated reveals (wrap render at T-14, game
 * preview at T-7, load-out plan at T-1) instead of a quiet dashboard.
 *
 * Pure module: everything derives from the event row so the home page and
 * event overview stay presentation-only.
 */

import { STAGE_CONFIG, type Stage } from "@/types";

/* -------------------------------------------------------------------------
 * Operational delivery feed
 * ---------------------------------------------------------------------- */

export type FeedState = "done" | "active" | "upcoming";

export interface DeliveryFeedItem {
  label: string;
  detail: string;
  state: FeedState;
}

export interface DeliveryFeedInput {
  stage: Stage;
  eventDateStart: string;
  venueName?: string | null;
  now?: Date;
}

function daysUntil(iso: string, now: Date): number {
  const [y, m, d] = iso.split("T")[0].split("-").map(Number);
  const target = new Date(y, m - 1, d).getTime();
  const today = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  ).getTime();
  return Math.round((target - today) / 86_400_000);
}

/**
 * The behind-the-scenes timeline shown during the delivery window.
 *
 * Returns null outside that window (before kickoff there's nothing to show;
 * once the event is live or past, the live/report surfaces take over).
 */
export function buildDeliveryFeed(
  input: DeliveryFeedInput,
): DeliveryFeedItem[] | null {
  const order = STAGE_CONFIG[input.stage]?.order ?? 0;
  const now = input.now ?? new Date();
  const toEvent = daysUntil(input.eventDateStart, now);

  // Window: kickoff done through load-out, event still ahead.
  if (order < 1 || order > 6 || toEvent < 0) return null;

  const venue = input.venueName?.trim() || "your venue";
  const state = (doneAt: number, activeAt: number): FeedState =>
    order >= doneAt ? "done" : order >= activeAt ? "active" : "upcoming";

  return [
    {
      label: "Booked in",
      detail: "Machine reserved, dates locked, team assigned.",
      state: "done",
    },
    {
      label: "Creative locked",
      detail: "Wrap, game and screen content signed off with your team.",
      state: state(4, 2),
    },
    {
      label: "Machine wrapped in your brand",
      detail: "Printed, applied and photographed at our Milton Keynes HQ.",
      state: state(5, 4),
    },
    {
      label: "Product-tested and dry-run",
      detail: "Your giveaway items loaded, dispensing tested end to end.",
      state: state(6, 5),
    },
    {
      label: `In transit to ${venue}`,
      detail:
        toEvent <= 2
          ? "On the van — set-up and testing happen before doors open."
          : `Ships in the final run-up · ${toEvent} days to go.`,
      state: order >= 6 && toEvent <= 2 ? "active" : "upcoming",
    },
  ];
}

/* -------------------------------------------------------------------------
 * Staged reveals — anticipation beats a quiet dashboard
 * ---------------------------------------------------------------------- */

export interface StagedReveal {
  key: "wrap" | "game" | "loadout";
  title: string;
  body: string;
  unlocked: boolean;
  /** e.g. "Unlocks 14 days out" — shown on locked cards. */
  unlocksLabel: string;
}

export interface StagedRevealsInput {
  eventDateStart: string;
  venueName?: string | null;
  now?: Date;
}

const REVEAL_GATES: ReadonlyArray<{
  key: StagedReveal["key"];
  atDays: number;
  title: string;
  body: (venue: string) => string;
}> = [
  {
    key: "wrap",
    atDays: 14,
    title: "Your machine, in your brand",
    body: () =>
      "The wrap render is in — this is what people will walk towards on the day.",
  },
  {
    key: "game",
    atDays: 7,
    title: "Your game, ready to play",
    body: () =>
      "Built in your colours with your prizes behind it. Your team gets first play on the day.",
  },
  {
    key: "loadout",
    atDays: 1,
    title: "Load-out day",
    body: (venue) =>
      `The machine travels to ${venue} — our crew sets up, tests and hands over before doors.`,
  },
];

/**
 * The three time-gated reveal cards. Null once the event has started —
 * anticipation is a pre-event device only.
 */
export function buildStagedReveals(
  input: StagedRevealsInput,
): StagedReveal[] | null {
  const now = input.now ?? new Date();
  const toEvent = daysUntil(input.eventDateStart, now);
  if (toEvent < 0) return null;

  const venue = input.venueName?.trim() || "your venue";
  return REVEAL_GATES.map((gate) => ({
    key: gate.key,
    title: gate.title,
    body: gate.body(venue),
    unlocked: toEvent <= gate.atDays,
    unlocksLabel:
      gate.atDays === 1 ? "Unlocks the day before" : `Unlocks ${gate.atDays} days out`,
  }));
}
