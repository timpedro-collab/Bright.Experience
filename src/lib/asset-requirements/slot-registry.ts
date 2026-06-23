/**
 * Machine-asset placeholder slot registry — types + letter scheme.
 *
 * Every on-machine creative position is addressable by a stable
 * `${machineSlug}/${placementKey}` key, carries a human-readable letter
 * (A–I per machine) and a clearly-marked placeholder label. This is the
 * scaffold layer Theo drops final preview art into: he edits the per-variant
 * `preview` geometry / `screenImage` in `machine-placements.ts` and the rest
 * of the app keeps working unchanged.
 */

import type { PlacementPreview } from "./placements";

/** Catalog machine slug — matches `machines.slug` in the DB/seed. */
export type MachineSlug =
  | "experience-portal-compact"
  | "experience-portal"
  | "experience-portal-xl";

/**
 * Stable placement key — matches a `GAME_FLOW_ASSET_SPECS[].key` that has an
 * on-machine preview. `brand-guidelines` is intentionally excluded (a document,
 * no on-machine position).
 */
export type PlacementKey =
  | "idle-advert"
  | "prompt-video"
  | "game-banner"
  | "payment-terminal"
  | "machine-wrap"
  | "product-packshot"
  | "negative-icons"
  | "brand-logo"
  | "home-banner";

/** Composite registry key, e.g. "experience-portal-xl/idle-advert". */
export type SlotKey = `${MachineSlug}/${PlacementKey}`;

export interface PlacementSlotDefinition {
  slotKey: SlotKey;
  machineSlug: MachineSlug;
  /** Full machine name, e.g. "Experience Portal XL". */
  machineLabel: string;
  /** Compact machine name for badges, e.g. "EP XL". */
  machineShortLabel: string;
  placementKey: PlacementKey;
  /** Human placement name — also the join key to `assets.name`. */
  placementLabel: string;
  /** Letter badge, A–I, ordered by the game flow. */
  slotLetter: string;
  /** Marked-up label shown on the placeholder, e.g. "EP XL / A · Idle Screen Advert". */
  placeholderLabel: string;
  /** Join to `assets.name`. */
  assetName: string;
  /** Per-variant preview geometry (scaffold; Theo recalibrates). */
  preview: PlacementPreview;
}

/** Letter assignment, ordered by the game-flow journey. */
export const SLOT_LETTERS: Record<PlacementKey, string> = {
  "idle-advert": "A",
  "prompt-video": "B",
  "game-banner": "C",
  "payment-terminal": "D",
  "machine-wrap": "E",
  "product-packshot": "F",
  "negative-icons": "G",
  "brand-logo": "H",
  "home-banner": "I",
};

/** PlacementKey -> the seeded `assets.name` it corresponds to. */
export const PLACEMENT_KEY_TO_ASSET_NAME: Record<PlacementKey, string> = {
  "idle-advert": "Idle Screen Advert",
  "prompt-video": "Game Prompt Video",
  "game-banner": "Game Page Banner",
  "payment-terminal": "Payment Terminal Screen",
  "machine-wrap": "Machine Wrap Artwork",
  "product-packshot": "Product Packshot",
  "negative-icons": "Negative Icons (×6)",
  "brand-logo": "Primary Brand Logo",
  "home-banner": "Home Banner Ad",
};

/** Reverse lookup: `assets.name` -> PlacementKey (or null if no on-machine slot). */
export const ASSET_NAME_TO_PLACEMENT_KEY: Record<string, PlacementKey> =
  Object.fromEntries(
    Object.entries(PLACEMENT_KEY_TO_ASSET_NAME).map(([key, name]) => [
      name,
      key as PlacementKey,
    ]),
  );

export interface MachineVariant {
  slug: MachineSlug;
  label: string;
  shortLabel: string;
  /** Backdrop render Theo swaps when final cabinet art lands. */
  screenImage: string;
}

/**
 * The three dispensing portal variants used for creative slot placement.
 * Slugs are kept stable (they wire the quiz, packages and asset slots); the
 * labels mirror the public catalogue names. `screenImage` points at a distinct
 * placeholder file per variant so Theo knows exactly which asset to swap.
 * The frozen unit (Callisto) and the Kiosk range are catalogue-only and do not
 * carry creative slot placements, so they are intentionally excluded here.
 */
export const MACHINE_VARIANTS: MachineVariant[] = [
  {
    slug: "experience-portal-compact",
    label: "Blinx Experience Portal",
    shortLabel: "Blinx",
    screenImage: "/machine/placeholders/compact.png",
  },
  {
    slug: "experience-portal",
    label: "Europa Experience Portal",
    shortLabel: "Europa",
    screenImage: "/machine/placeholders/portal.png",
  },
  {
    slug: "experience-portal-xl",
    label: "Hyperion Experience Portal",
    shortLabel: "Hyperion",
    screenImage: "/machine/placeholders/xl.png",
  },
];

export const DEFAULT_MACHINE_SLUG: MachineSlug = "experience-portal";

/** Builds the marked-up label shown on a placeholder. */
export function buildPlaceholderLabel(
  machineShortLabel: string,
  slotLetter: string,
  placementLabel: string,
): string {
  return `${machineShortLabel} / ${slotLetter} · ${placementLabel}`;
}
