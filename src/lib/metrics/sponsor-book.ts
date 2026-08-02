/**
 * The organizer's whole sponsorship book, grouped by show.
 *
 * A flat list of slots answers "what have I got"; a sales lead needs "what am
 * I about to lose". Inventory is perishable — an unsold machine at a show that
 * opens next week is worth nothing the day after — so the book is ordered by
 * how close each show is to its doors, and slots still open on a show inside
 * the selling window are flagged.
 *
 * Pure, and takes the slot rows a page already loaded.
 */

import { daysBetween, isoToday } from "./show-schedule";

/**
 * Weeks left to sell a slot before it's realistically gone. Three is the point
 * most exhibitors have already committed their show budget and their creative
 * deadline has passed, so anything unsold inside it needs a call rather than a
 * place on a list.
 */
const CLOSING_WINDOW_DAYS = 21;

/** Where a slot sits commercially. */
export type SlotUrgency = "sold" | "open" | "closing" | "missed";

/** The fields the book groups and scores on. Callers may carry more. */
export interface SponsorBookSlot {
  id: string;
  eventId: string | null;
  showName: string;
  status: string;
  startDate: string;
  price: number | null;
}

/** A slot with the commercial read added. */
export type ScoredSlot<T extends SponsorBookSlot> = T & {
  urgency: SlotUrgency;
  daysToDoors: number;
};

/** One show's page in the book. */
export interface SponsorBookShow<T extends SponsorBookSlot> {
  eventId: string | null;
  showName: string;
  /** Earliest slot start at this show — its doors, for ordering. */
  startDate: string;
  daysToDoors: number;
  slots: ScoredSlot<T>[];
  soldCount: number;
  openCount: number;
  /** Open slots inside the selling window, or already past the doors. */
  atRiskCount: number;
  soldValue: number;
  openValue: number;
}

/** How urgent one slot is, given how far off its show is. */
export function slotUrgency(
  status: string,
  daysToDoors: number
): SlotUrgency {
  if (status !== "available") return "sold";
  if (daysToDoors < 0) return "missed";
  return daysToDoors <= CLOSING_WINDOW_DAYS ? "closing" : "open";
}

/**
 * Group slots into shows, scored and ordered by urgency.
 *
 * Shows still to come sort first, nearest doors at the top, because those are
 * the only ones a sales call can still change. Shows already run follow, most
 * recent first, since they're read for what they made rather than acted on.
 */
export function buildSponsorBook<T extends SponsorBookSlot>(
  slots: T[],
  today: string = isoToday()
): SponsorBookShow<T>[] {
  const groups = new Map<string, SponsorBookShow<T>>();

  for (const slot of slots) {
    const key = slot.eventId ?? `name:${slot.showName}`;
    const daysToDoors = daysBetween(slot.startDate, today);
    const scored: ScoredSlot<T> = {
      ...slot,
      daysToDoors,
      urgency: slotUrgency(slot.status, daysToDoors),
    };

    const existing = groups.get(key);
    const group: SponsorBookShow<T> = existing ?? {
      eventId: slot.eventId,
      showName: slot.showName,
      startDate: slot.startDate,
      daysToDoors,
      slots: [],
      soldCount: 0,
      openCount: 0,
      atRiskCount: 0,
      soldValue: 0,
      openValue: 0,
    };

    group.slots.push(scored);
    if (scored.urgency === "sold") {
      group.soldCount++;
      group.soldValue += slot.price ?? 0;
    } else {
      group.openCount++;
      group.openValue += slot.price ?? 0;
      if (scored.urgency !== "open") group.atRiskCount++;
    }
    // A show's doors are its earliest slot: slots can start mid-show, and the
    // group is ordered on when selling stops mattering.
    if (Date.parse(slot.startDate) < Date.parse(group.startDate)) {
      group.startDate = slot.startDate;
      group.daysToDoors = daysToDoors;
    }

    groups.set(key, group);
  }

  return [...groups.values()].sort((a, b) => {
    const aPast = a.daysToDoors < 0;
    const bPast = b.daysToDoors < 0;
    if (aPast !== bPast) return aPast ? 1 : -1;
    return aPast ? b.daysToDoors - a.daysToDoors : a.daysToDoors - b.daysToDoors;
  });
}

/** Totals across the whole book, for the header line. */
export interface SponsorBookTotals {
  slots: number;
  sold: number;
  open: number;
  atRisk: number;
  soldValue: number;
  openValue: number;
}

/** Roll the book up into the numbers a sales lead checks first. */
export function sponsorBookTotals<T extends SponsorBookSlot>(
  shows: SponsorBookShow<T>[]
): SponsorBookTotals {
  return shows.reduce<SponsorBookTotals>(
    (totals, show) => ({
      slots: totals.slots + show.slots.length,
      sold: totals.sold + show.soldCount,
      open: totals.open + show.openCount,
      atRisk: totals.atRisk + show.atRiskCount,
      soldValue: totals.soldValue + show.soldValue,
      openValue: totals.openValue + show.openValue,
    }),
    { slots: 0, sold: 0, open: 0, atRisk: 0, soldValue: 0, openValue: 0 }
  );
}

/** How long is left to sell at this show, phrased for a heading. */
export function doorsLabel(daysToDoors: number): string {
  if (daysToDoors > 1) return `${daysToDoors} days to doors`;
  if (daysToDoors === 1) return "Doors tomorrow";
  if (daysToDoors === 0) return "Doors today";
  return "Already run";
}
