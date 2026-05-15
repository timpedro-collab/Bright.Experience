/**
 * Bright.Studio rate card + the asset specs an Experience Portal needs.
 *
 * The Studio rate card is a matrix: three tiers × two media (static / motion).
 * Each tier escalates the inclusions of the previous one. Pricing is per
 * asset; standard lead time is 7 working days; rush jobs add a 50% express fee.
 *
 * Source of truth lives here — every customer surface (proposal brochure,
 * briefing asset-upload step) imports from this file so updates land in one
 * place.
 */

import { formatGBP } from "./roi";

/* ----------------------------------------------------------------------------
 * Asset specs — what the customer needs to provide if they own the creative
 * ------------------------------------------------------------------------- */

/** Each asset is either a static visual or a motion visual; that drives which Studio rate column applies. */
export type AssetMedium = "static" | "motion";

export interface AssetSpec {
  slug: string;
  /** Short heading, customer-facing. */
  label: string;
  /** Concrete spec line ("1080 × 1920 · MP4 · 25 Mb max"). */
  spec: string;
  /** What it's for, in customer language. */
  purpose: string;
  /** Which Studio rate column applies if the customer asks Bright.Studio to produce it. */
  medium: AssetMedium;
}

/**
 * Asset specs the customer needs to provide IF they have their own creative
 * team. Edit one place to update every customer surface that references them.
 *
 * NOTE: These are placeholder portal hardware specs pending the real spec
 * sheet. Replace the `spec` strings with the canonical values when ready.
 */
export const ASSET_SPECS: ReadonlyArray<AssetSpec> = [
  {
    slug: "screen-attract",
    label: "Attract-loop video",
    spec: "1080 × 1920 (portrait) · MP4 (H.264) · 25 Mb max · 8–30 s loop",
    purpose: "What the portal plays when no one is interacting — the bait.",
    medium: "motion",
  },
  {
    slug: "screen-game",
    label: "In-game brand frame",
    spec: "1080 × 1920 · PNG with transparency · ≤ 2 Mb",
    purpose: "Sits around the game UI during play.",
    medium: "static",
  },
  {
    slug: "wrap-vinyl",
    label: "Portal wrap artwork",
    spec: "Vector PDF (CMYK) · 5 mm bleed · fonts outlined",
    purpose: "The physical wrap of the portal cabinet.",
    medium: "static",
  },
  {
    slug: "logo-pack",
    label: "Logo pack",
    spec: "SVG + 1024 × 1024 transparent PNG",
    purpose: "Used on splash, win, and lead-capture screens.",
    medium: "static",
  },
  {
    slug: "win-screen",
    label: "Win-screen creative",
    spec: "1080 × 1920 · PNG or static frame · ≤ 1 Mb",
    purpose: "What appears the moment a player wins — your reward moment.",
    medium: "static",
  },
  {
    slug: "brand-fonts",
    label: "Brand fonts (optional)",
    spec: "WOFF2 or OTF · license note included",
    purpose: "So the digital surfaces match your existing brand system.",
    medium: "static",
  },
] as const;

/* ----------------------------------------------------------------------------
 * Bright.Studio rate card — per asset, matrixed by tier × medium
 * ------------------------------------------------------------------------- */

/** One of the three Studio service tiers, each escalating the previous one's inclusions. */
export type StudioTierSlug = "essential" | "professional" | "new-asset";

export interface StudioTier {
  slug: StudioTierSlug;
  /** Customer-facing tier name. */
  label: string;
  /** Two-line summary surfaced under the price. */
  description: string;
  /** Per-asset price for static visuals, in pence. */
  staticPricePence: number;
  /** Per-asset price for motion visuals (10–30 s), in pence. */
  motionPricePence: number;
  /** Bullet list of inclusions the customer reads. */
  inclusions: ReadonlyArray<string>;
}

export const STUDIO_TIERS: ReadonlyArray<StudioTier> = [
  {
    slug: "essential",
    label: "Essential Enhancements",
    description: "Brings your asset up to portal standard.",
    staticPricePence: 3_200,
    motionPricePence: 16_000,
    inclusions: [
      "Aspect ratio correction",
      "Size compression",
      "Background removal",
      "Colour matching",
    ],
  },
  {
    slug: "professional",
    label: "Professional Enhancements",
    description: "Transforms your asset with expert detail.",
    staticPricePence: 7_200,
    motionPricePence: 48_000,
    inclusions: [
      "Everything in Essential",
      "Quality boost",
      "Layout adjustments",
      "Web asset sourcing",
      "Web asset adaptation",
    ],
  },
  {
    slug: "new-asset",
    label: "New Asset Creation",
    description: "Original creative from the ground up.",
    staticPricePence: 12_000,
    motionPricePence: 108_000,
    inclusions: [
      "Everything in Professional",
      "Concept development",
      "Custom graphics",
      "Brand alignment",
      "Original layouts",
      "Multi-format delivery",
    ],
  },
] as const;

/** Standard lead time and the express-fee uplift, surfaced as a single footnote. */
export const STUDIO_TURNAROUND = {
  standardWorkingDays: 7,
  expressUpliftPercent: 50,
} as const;

/* ----------------------------------------------------------------------------
 * Display helpers
 * ------------------------------------------------------------------------- */

/** Format a Studio tier price for the given medium. */
export function formatTierPrice(tier: StudioTier, medium: AssetMedium): string {
  const pence =
    medium === "motion" ? tier.motionPricePence : tier.staticPricePence;
  return formatGBP(pence / 100);
}

/** Human label for a medium, used inline in customer copy. */
export function mediumLabel(medium: AssetMedium): string {
  return medium === "motion" ? "Motion" : "Static";
}
