/**
 * Is this unit ready for the doors to open?
 *
 * Before a show there is no telemetry, so the live scoreboard reads as four
 * zeroes and tells an organizer nothing. What they actually need in the run-up
 * is the same thing a stand manager needs: a short list of what is settled,
 * what is outstanding, and — critically — whose move each one is. Half of the
 * list is theirs (where the unit stands, what job it does, chasing a sponsor's
 * artwork) and half is ours (game built, QA passed, stock loaded); mixing the
 * two into one undifferentiated "to do" is how things get dropped.
 *
 * Pure and free of URLs beyond the ones handed in, so the same derivation
 * drives the machine page, the show run-up view and the portfolio card.
 */

import { missionLabel } from "@/lib/fleet-labels";
import type { MachineMission } from "@/types";

/**
 * `optional` is not a gap: a screen-only kiosk has no stock to load and a unit
 * the organizer never offered to a sponsor has no artwork to chase. Those
 * items still render — silence would read as an oversight — but they are
 * excluded from the progress count so a fully-prepared unit reads 100%.
 */
export type ReadinessState = "done" | "todo" | "waiting" | "optional";

export type ReadinessItemId =
  | "zone"
  | "mission"
  | "configuration"
  | "stock"
  | "sponsor"
  | "creative";

/** Who has to act. Drives whether an item is shown as chaseable or informational. */
export type ReadinessOwner = "organizer" | "brightblue";

export interface ReadinessItem {
  id: ReadinessItemId;
  /** Short noun for the row. */
  label: string;
  /** One line stating what is true right now, not what should be. */
  detail: string;
  state: ReadinessState;
  owner: ReadinessOwner;
  /** Where the fix lives, when there is somewhere to send them. */
  href?: string;
}

/** The configuration resolved for this unit, reduced to what readiness needs. */
export interface ReadinessConfig {
  /** `draft` | `submitted` | `configured` | `tested`. */
  status: string;
  gameId: string | null;
  /** Total prizes across every line. */
  prizeCount: number;
}

/** The sponsor slot on this unit, if it is being sold at all. */
export interface ReadinessSlot {
  sponsorName: string | null;
  status: string;
  /** Creative pieces attached to the slot, and how many cleared review. */
  creativeCount: number;
  creativeApproved: number;
}

export interface UnitReadinessInput {
  zone?: string | null;
  mission?: MachineMission | null;
  config?: ReadinessConfig | null;
  slot?: ReadinessSlot | null;
  /** Product loaded for this unit. Null when nothing has been planned yet. */
  stockUnits?: number | null;
  /**
   * False for a screen-only unit. Defaults to true because every dispensing
   * portal in the catalogue is the common case, and over-reporting a gap is
   * safer than hiding one.
   */
  dispensesProduct?: boolean;
  /** Deep links to where each gap is fixed. Any missing key renders as plain text. */
  hrefs?: Partial<Record<ReadinessItemId, string>>;
}

/** Configuration states that mean the build is finished, not in flight. */
const CONFIG_SETTLED = new Set(["configured", "tested"]);

/**
 * The readiness checklist for one unit, in the order an organizer works
 * through it: place it, give it a job, then everything that has to arrive
 * before it can run.
 */
export function buildUnitReadiness(input: UnitReadinessInput): ReadinessItem[] {
  const {
    zone,
    mission,
    config,
    slot,
    stockUnits,
    dispensesProduct = true,
    hrefs = {},
  } = input;

  const items: ReadinessItem[] = [];
  const trimmedZone = zone?.trim();

  items.push({
    id: "zone",
    label: "Where it stands",
    detail: trimmedZone
      ? trimmedZone
      : "No zone yet — the venue needs one to place it on the floor plan.",
    state: trimmedZone ? "done" : "todo",
    owner: "organizer",
    href: hrefs.zone,
  });

  items.push({
    id: "mission",
    label: "What it's here to do",
    detail: mission
      ? missionLabel(mission)
      : "No job set, so we can't decide which game belongs on it.",
    state: mission ? "done" : "todo",
    owner: "organizer",
    href: hrefs.mission,
  });

  items.push({
    id: "configuration",
    label: "Game and prizes",
    detail: configDetail(config),
    state: configState(config),
    owner: "brightblue",
    href: hrefs.configuration,
  });

  if (dispensesProduct) {
    items.push({
      id: "stock",
      label: "Stock",
      detail:
        stockUnits && stockUnits > 0
          ? `${stockUnits.toLocaleString("en-GB")} items planned for this show`
          : "No product planned yet.",
      state: stockUnits && stockUnits > 0 ? "done" : "waiting",
      owner: "brightblue",
      href: hrefs.stock,
    });
  } else {
    items.push({
      id: "stock",
      label: "Stock",
      detail: "Screen-only unit — nothing to load.",
      state: "optional",
      owner: "brightblue",
    });
  }

  items.push(sponsorItem(slot, hrefs.sponsor));
  items.push(creativeItem(slot, hrefs.creative));

  return items;
}

function configDetail(config?: ReadinessConfig | null): string {
  if (!config) return "Not built yet — we set this up with the brand.";
  if (!config.gameId) return "Game still to be chosen.";
  if (config.status === "tested") {
    return config.prizeCount > 0
      ? `Built and tested, ${config.prizeCount.toLocaleString("en-GB")} prizes`
      : "Built and tested";
  }
  if (config.status === "configured") return "Built, still to be tested";
  if (config.status === "submitted") return "Submitted, we're building it now";
  return "Being drafted with the brand";
}

function configState(config?: ReadinessConfig | null): ReadinessState {
  if (!config || !config.gameId) return "waiting";
  return CONFIG_SETTLED.has(config.status) ? "done" : "waiting";
}

/**
 * A unit with no slot is not a gap — plenty of units are the organizer's own
 * welcome gift and were never for sale — so it reads as an opportunity rather
 * than an outstanding task.
 */
function sponsorItem(slot: ReadinessSlot | null | undefined, href?: string): ReadinessItem {
  if (!slot) {
    return {
      id: "sponsor",
      label: "Sponsor",
      detail: "Not offered for sale. Open a slot if you want to sell this unit.",
      state: "optional",
      owner: "organizer",
      href,
    };
  }
  if (slot.sponsorName) {
    return {
      id: "sponsor",
      label: "Sponsor",
      detail: `Sold to ${slot.sponsorName}`,
      state: "done",
      owner: "organizer",
      href,
    };
  }
  return {
    id: "sponsor",
    label: "Sponsor",
    detail: "Open slot, no sponsor yet.",
    state: "todo",
    owner: "organizer",
    href,
  };
}

/**
 * Artwork only matters once somebody has bought the unit. Until then there is
 * no brand to chase, and asking for creative would be noise.
 */
function creativeItem(slot: ReadinessSlot | null | undefined, href?: string): ReadinessItem {
  if (!slot?.sponsorName) {
    return {
      id: "creative",
      label: "Sponsor artwork",
      detail: "Nothing to collect until the unit is sold.",
      state: "optional",
      owner: "organizer",
      href,
    };
  }
  if (slot.creativeCount === 0) {
    return {
      id: "creative",
      label: "Sponsor artwork",
      detail: `Nothing from ${slot.sponsorName} yet.`,
      state: "todo",
      owner: "organizer",
      href,
    };
  }
  if (slot.creativeApproved >= slot.creativeCount) {
    return {
      id: "creative",
      label: "Sponsor artwork",
      detail:
        slot.creativeCount === 1
          ? "Approved and ready to print"
          : `${slot.creativeCount} pieces approved`,
      state: "done",
      owner: "organizer",
      href,
    };
  }
  return {
    id: "creative",
    label: "Sponsor artwork",
    detail: `${slot.creativeCount - slot.creativeApproved} of ${
      slot.creativeCount
    } still in review with us.`,
    state: "waiting",
    owner: "brightblue",
    href,
  };
}

/** Counts and cuts of a checklist, so no surface recomputes them by hand. */
export interface ReadinessProgress {
  done: number;
  /** Items that count towards readiness — `optional` excluded. */
  total: number;
  /** Outstanding items the organizer can clear themselves. */
  organizerTodo: ReadinessItem[];
  /** Outstanding items sitting with Bright.Blue. */
  waitingOnUs: ReadinessItem[];
  isReady: boolean;
}

/** Roll a checklist up into the numbers a header or a card shows. */
export function readinessProgress(items: ReadinessItem[]): ReadinessProgress {
  const counted = items.filter((item) => item.state !== "optional");
  const done = counted.filter((item) => item.state === "done").length;
  return {
    done,
    total: counted.length,
    organizerTodo: items.filter((item) => item.state === "todo"),
    waitingOnUs: items.filter((item) => item.state === "waiting"),
    isReady: counted.length > 0 && done === counted.length,
  };
}

/**
 * One line for the top of the card. Leads with what the organizer owns,
 * because that is the only part they can act on right now.
 */
export function readinessHeadline(progress: ReadinessProgress): string {
  if (progress.isReady) return "Ready for the doors to open";
  const mine = progress.organizerTodo.length;
  const ours = progress.waitingOnUs.length;
  if (mine > 0) {
    return `${mine} thing${mine === 1 ? "" : "s"} need${mine === 1 ? "s" : ""} you`;
  }
  if (ours > 0) {
    return `Nothing needs you — ${ours} item${ours === 1 ? "" : "s"} with Bright.Blue`;
  }
  return "Getting this unit ready";
}