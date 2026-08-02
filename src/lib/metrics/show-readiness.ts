/**
 * Readiness for a whole show, assembled from the rows a page already loaded.
 *
 * `unit-readiness.ts` knows what "ready" means for one machine. This knows how
 * to feed it: which configuration row applies to which unit, which sponsor
 * slot sits on it, and which pieces of artwork that slot is carrying. Both the
 * machine page and the show page run through here so a unit can never read as
 * ready in one place and outstanding in the other.
 *
 * Pure, and takes already-fetched rows rather than an event id, so it stays
 * testable and adds no queries of its own.
 */

import {
  buildUnitReadiness,
  readinessProgress,
  type ReadinessItem,
  type ReadinessItemId,
} from "./unit-readiness";
import { resolveConfigForMachine, type ScopedConfig } from "@/lib/configuration/resolve-config";
import type { MachineMission } from "@/types";

/** A unit as the readiness pass needs it. */
export interface ReadinessMachine {
  id: string;
  /** Nickname or serial — whatever the page calls the unit. */
  label: string;
  zone: string | null;
  mission: MachineMission | null;
  /** False for a screen-only unit, which has no stock to plan. */
  dispensesProduct?: boolean;
}

/** A game configuration row, reduced to what readiness reads. */
export interface ReadinessGameConfig extends ScopedConfig {
  status: string;
  gameId: string | null;
  prizesJson: { quantity?: number | string | null }[];
}

/** A product configuration row, reduced to what readiness reads. */
export interface ReadinessProductConfig extends ScopedConfig {
  totalUnits: number | null;
}

/** A sponsorship slot, reduced to what readiness reads. */
export interface ReadinessSlotRow {
  machineInstanceId: string | null;
  sponsorName: string | null;
  status: string;
  creativeAssetIds: string[];
}

/** Where each piece of artwork sits in review, keyed by asset id. */
export type CreativeReviewIndex = Record<string, string>;

export interface ShowReadinessContext {
  gameConfigs: ReadinessGameConfig[];
  productConfigs: ReadinessProductConfig[];
  slots: ReadinessSlotRow[];
  /** Review status by asset id. Missing ids count as attached but unapproved. */
  creativeReview?: CreativeReviewIndex;
  /** Deep links, resolved per unit by the caller if they differ. */
  hrefs?: Partial<Record<ReadinessItemId, string>>;
}

/** Total prizes across every line of a configuration. */
function prizeTotal(config: ReadinessGameConfig | null): number {
  if (!config) return 0;
  return config.prizesJson.reduce(
    (sum, prize) => sum + (Number(prize.quantity) || 0),
    0
  );
}

/**
 * The slot sitting on a unit. A show can hold slots with no machine assigned
 * yet; those belong to nobody's checklist until someone attaches them.
 */
function slotFor(
  slots: ReadinessSlotRow[],
  machineId: string
): ReadinessSlotRow | null {
  return slots.find((slot) => slot.machineInstanceId === machineId) ?? null;
}

/** The readiness checklist for one unit of a show. */
export function unitReadinessFor(
  machine: ReadinessMachine,
  context: ShowReadinessContext
): ReadinessItem[] {
  const { gameConfigs, productConfigs, slots, creativeReview = {}, hrefs } = context;

  const config = resolveConfigForMachine(gameConfigs, machine.id);
  const stock = resolveConfigForMachine(productConfigs, machine.id);
  const slot = slotFor(slots, machine.id);

  return buildUnitReadiness({
    zone: machine.zone,
    mission: machine.mission,
    config: config
      ? {
          status: config.status,
          gameId: config.gameId,
          prizeCount: prizeTotal(config),
        }
      : null,
    slot: slot
      ? {
          sponsorName: slot.sponsorName,
          status: slot.status,
          creativeCount: slot.creativeAssetIds.length,
          creativeApproved: slot.creativeAssetIds.filter(
            (id) => creativeReview[id] === "approved"
          ).length,
        }
      : null,
    stockUnits: stock?.totalUnits ?? null,
    dispensesProduct: machine.dispensesProduct,
    hrefs,
  });
}

/** One unit's row on a show-wide readiness board. */
export interface ShowReadinessRow {
  machine: ReadinessMachine;
  items: ReadinessItem[];
  /** Outstanding items the organizer owns, worst case first in the list. */
  organizerTodo: ReadinessItem[];
  waitingOnUs: ReadinessItem[];
  isReady: boolean;
  done: number;
  total: number;
}

/**
 * Readiness for every unit at a show, in the order the fleet was given.
 *
 * Units the organizer still owes something on sort to the top, because the
 * board exists to be worked through rather than admired.
 */
export function showReadinessRows(
  machines: ReadinessMachine[],
  context: ShowReadinessContext
): ShowReadinessRow[] {
  const rows = machines.map((machine) => {
    const items = unitReadinessFor(machine, context);
    const progress = readinessProgress(items);
    return {
      machine,
      items,
      organizerTodo: progress.organizerTodo,
      waitingOnUs: progress.waitingOnUs,
      isReady: progress.isReady,
      done: progress.done,
      total: progress.total,
    };
  });

  return rows.sort(
    (a, b) => b.organizerTodo.length - a.organizerTodo.length
  );
}

/** Show-level counts, for a header line or a portfolio card. */
export interface ShowReadinessSummary {
  units: number;
  ready: number;
  /** Outstanding items across the show that the organizer owns. */
  organizerTodo: number;
  /** Units with at least one item sitting with Bright.Blue. */
  waitingOnUs: number;
}

/** Roll the board up into the one line a card can carry. */
export function showReadinessSummary(
  rows: ShowReadinessRow[]
): ShowReadinessSummary {
  return {
    units: rows.length,
    ready: rows.filter((row) => row.isReady).length,
    organizerTodo: rows.reduce((sum, row) => sum + row.organizerTodo.length, 0),
    waitingOnUs: rows.filter((row) => row.waitingOnUs.length > 0).length,
  };
}

/**
 * The summary as a sentence. Says what is done first, then what is left, so
 * the line reads the same whether a show is fully prepared or barely started.
 */
export function showReadinessLine(summary: ShowReadinessSummary): string {
  if (summary.units === 0) return "No units on this show yet";
  const base = `${summary.ready} of ${summary.units} unit${
    summary.units === 1 ? "" : "s"
  } ready`;
  if (summary.organizerTodo === 0) return base;
  return `${base} · ${summary.organizerTodo} thing${
    summary.organizerTodo === 1 ? "" : "s"
  } need you`;
}
