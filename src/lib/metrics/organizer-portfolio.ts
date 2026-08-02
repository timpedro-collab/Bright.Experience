/**
 * Portfolio roll-up for the organizer shows list.
 *
 * An organizer's landing page has to answer three things before they click
 * anything: how much hardware is out there, what still needs a decision from
 * them, and how much sponsor money is on the table. Those numbers come from
 * three tables (machines, slots, telemetry) and are cheap to combine in
 * memory, so the query fetches them in one round each and these pure
 * functions do the arithmetic.
 *
 * Kept separate from `fleet.ts`: that module answers "which unit is dead" for
 * one show; this one answers "how is the whole book of shows doing".
 */

import { OFFLINE_AFTER_MS } from "./fleet";

/** A deployed unit, as much of it as the roll-up needs. */
export interface PortfolioMachineRow {
  zone?: string | null;
  mission?: string | null;
  last_heartbeat?: string | null;
}

/** A sponsorship slot on one show. */
export interface PortfolioSlotRow {
  status?: string | null;
  price?: number | null;
}

/** A telemetry row within the window being summarised. */
export interface PortfolioTelemetryRow {
  event_type?: string | null;
}

/** Everything the shows list shows about one show without opening it. */
export interface ShowSummary {
  machines: number;
  /** Distinct named zones. Units with no zone don't invent one. */
  zones: number;
  /** Units missing a zone or a mission — the organizer's to-do. */
  needsSetup: number;
  online: number;
  slots: number;
  slotsSold: number;
  /** Pence. Sold and still-available slot value. */
  soldValue: number;
  openValue: number;
  playsToday: number;
  leadsToday: number;
}

/**
 * Summarise one show. `now` is passed in so a page never reads the clock
 * mid-render and every row in a list is judged against the same instant.
 */
export function buildShowSummary(input: {
  machines: PortfolioMachineRow[];
  slots: PortfolioSlotRow[];
  telemetry: PortfolioTelemetryRow[];
  now?: number;
}): ShowSummary {
  const { machines, slots, telemetry, now = Date.now() } = input;

  const zones = new Set<string>();
  let needsSetup = 0;
  let online = 0;
  for (const machine of machines) {
    const zone = machine.zone?.trim();
    if (zone) zones.add(zone);
    if (!zone || !machine.mission) needsSetup++;
    if (
      machine.last_heartbeat &&
      now - new Date(machine.last_heartbeat).getTime() < OFFLINE_AFTER_MS
    ) {
      online++;
    }
  }

  let slotsSold = 0;
  let soldValue = 0;
  let openValue = 0;
  for (const slot of slots) {
    const price = Number(slot.price) || 0;
    if (slot.status === "available") {
      openValue += price;
    } else {
      slotsSold++;
      soldValue += price;
    }
  }

  let playsToday = 0;
  let leadsToday = 0;
  for (const row of telemetry) {
    const type = String(row.event_type ?? "");
    if (type === "play_started" || type === "play_completed") playsToday++;
    else if (type === "lead_captured" || type === "lead") leadsToday++;
  }

  return {
    machines: machines.length,
    zones: zones.size,
    needsSetup,
    online,
    slots: slots.length,
    slotsSold,
    soldValue,
    openValue,
    playsToday,
    leadsToday,
  };
}

/** An empty summary, for a show with nothing deployed against it yet. */
export function emptyShowSummary(): ShowSummary {
  return buildShowSummary({ machines: [], slots: [], telemetry: [] });
}

/** Where a show sits relative to today. */
export type ShowRunState = "upcoming" | "running" | "finished";

/**
 * Whether a show is open today, still to come, or done.
 *
 * Compared on calendar days rather than instants: a show running today is
 * "running" from midnight, not from the hour its doors opened, because that's
 * how the organizer talks about it. Drives whether a surface polls for live
 * telemetry at all — a page that spins "Live" at a show in December reads as
 * broken.
 */
export function showRunState(
  startDate: string,
  endDate?: string | null,
  now: Date = new Date()
): ShowRunState {
  const today = now.toISOString().slice(0, 10);
  const start = startDate.slice(0, 10);
  const end = (endDate ?? startDate).slice(0, 10);
  if (today < start) return "upcoming";
  if (today > end) return "finished";
  return "running";
}

/** Portfolio totals, so the header never disagrees with the cards below it. */
export function portfolioTotals(summaries: ShowSummary[]) {
  const sum = (pick: (s: ShowSummary) => number) =>
    summaries.reduce((total, s) => total + pick(s), 0);

  return {
    shows: summaries.length,
    machines: sum((s) => s.machines),
    needsSetup: sum((s) => s.needsSetup),
    online: sum((s) => s.online),
    soldValue: sum((s) => s.soldValue),
    openValue: sum((s) => s.openValue),
    slots: sum((s) => s.slots),
    playsToday: sum((s) => s.playsToday),
    leadsToday: sum((s) => s.leadsToday),
  };
}
