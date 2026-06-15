/**
 * Canonical creative-asset requirements for the standard Bright.Blue game flow.
 *
 * This is the single source of truth for "what creative does a customer owe us"
 * for a game-machine event. It encodes the spec locked with Bright.Studio
 * (dimensions, file types, durations, safe zones, animation, transparency,
 * physical print). Each entry maps directly onto the `assets` table's rich
 * spec columns so the customer Assets page renders a full spec card and the
 * upload validator can check the file against it.
 *
 * `appliesWhen` lets a future conditional engine decide which slots show for a
 * given event (e.g. storefront-only surfaces, multi-product packshots). For now
 * every "always" + storefront slot is seeded so the page is complete.
 */

export type AssetApplicability =
  | "always"
  | "storefront"
  | "category_view"
  | "multi_product"
  | "product_details";

export interface GameFlowAssetSpec {
  /** Stable key — used to derive a deterministic row id per event. */
  key: string;
  name: string;
  description: string;
  /** Maps to assets.asset_type (logo | imagery | video | document | physical). */
  assetType: string;
  /** Human-readable format + size budget, e.g. "PNG / JPG · ≤150 kb". */
  requiredFormat?: string;
  /** Human-readable target dimensions, e.g. "1080 × 1920 px". */
  requiredDimensions?: string;
  requiredResolutionMin?: string;
  /** Seconds range for video, e.g. "15-30". */
  requiredDurationRange?: string;
  /** Accepted MIME types — drives upload validation. */
  requiredFileTypes?: string[];
  safeZoneDescription?: string;
  animationRequirements?: string;
  isPhysical?: boolean;
  /** When this requirement applies to an event. */
  appliesWhen: AssetApplicability;
}

export const GAME_FLOW_ASSET_SPECS: GameFlowAssetSpec[] = [
  {
    key: "brand-logo",
    name: "Primary Brand Logo",
    description:
      "Main logo for the machine wrap and digital touchpoints. Supply on a transparent background — no white box.",
    assetType: "logo",
    requiredFormat: "SVG or PNG (transparent, 300dpi)",
    requiredDimensions: "Minimum 2000px wide",
    requiredFileTypes: ["image/svg+xml", "image/png"],
    appliesWhen: "always",
  },
  {
    key: "brand-guidelines",
    name: "Brand Guidelines",
    description:
      "Full brand guide with colour codes (HEX), typography, and usage rules so our designers stay on-brand.",
    assetType: "document",
    requiredFormat: "PDF",
    requiredFileTypes: ["application/pdf"],
    appliesWhen: "always",
  },
  {
    key: "machine-wrap",
    name: "Machine Wrap Artwork",
    description:
      "Physical wrap for the machine body. Design over our supplied dieline. CMYK, print-ready.",
    assetType: "physical",
    requiredFormat: "Print-ready PDF · CMYK · 3mm bleed · 150dpi",
    isPhysical: true,
    appliesWhen: "always",
  },
  {
    key: "payment-terminal",
    name: "Payment Terminal Screen",
    description:
      "Static image on the card-payment screen. It stays lit while idle, so we recommend placing your logo here.",
    assetType: "imagery",
    requiredFormat: "PNG or JPG · ≤150 kb",
    requiredDimensions: "1080 × 1920 px",
    requiredResolutionMin: "1080x1920",
    requiredFileTypes: ["image/png", "image/jpeg"],
    appliesWhen: "always",
  },
  {
    key: "product-packshot",
    name: "Product Packshot",
    description:
      "Clean cut-out of the product, used throughout the game flow. Leave ~30px right padding on wide items.",
    assetType: "imagery",
    requiredFormat: "PNG (transparent) · ≤150 kb",
    requiredDimensions: "428 × 600 px",
    requiredFileTypes: ["image/png"],
    appliesWhen: "always",
  },
  {
    key: "negative-icons",
    name: "Negative Icons (×6)",
    description:
      "The six on-brand 'distractor' icons players must avoid tapping. Relevant to the game theme.",
    assetType: "imagery",
    requiredFormat: "PNG · ≤50 kb each",
    requiredDimensions: "300 × 300 px",
    requiredFileTypes: ["image/png"],
    appliesWhen: "always",
  },
  {
    key: "idle-advert",
    name: "Idle Screen Advert",
    description:
      "Attract-loop video that plays when the machine is idle — showcase the prizes with a clear 'play now' CTA.",
    assetType: "video",
    requiredFormat: "MP4 · 9:16 · ≤20 mb",
    requiredDimensions: "1080 × 1920 px",
    requiredDurationRange: "15-30",
    requiredFileTypes: ["video/mp4"],
    appliesWhen: "always",
  },
  {
    key: "prompt-video",
    name: "Game Prompt Video",
    description:
      "Short animated 'play now to win' teaser shown before the game.",
    assetType: "video",
    requiredFormat: "MP4 · ≤20 mb",
    requiredDimensions: "900 × 1600 px",
    requiredDurationRange: "5-10",
    requiredFileTypes: ["video/mp4"],
    safeZoneDescription: "Keep key content within the 804 × 682 px centre safe area (49px padding).",
    animationRequirements: "Animate elements in and out to avoid screen burn-in.",
    appliesWhen: "always",
  },
  {
    key: "game-banner",
    name: "Game Page Banner",
    description: "Header strip across the top of the gameplay screen.",
    assetType: "imagery",
    requiredFormat: "PNG · ≤150 kb",
    requiredDimensions: "1080 × 216 px",
    requiredFileTypes: ["image/png"],
    appliesWhen: "always",
  },
  {
    key: "home-banner",
    name: "Home Banner Ad",
    description:
      "Hero banner at the top of the storefront homepage. Keep all text and logos inside the safe area.",
    assetType: "imagery",
    requiredFormat: "JPG or PNG · ≤150 kb",
    requiredDimensions: "2160 × 816 px (total)",
    requiredFileTypes: ["image/png", "image/jpeg"],
    safeZoneDescription: "Safe area 2064 × 600 px with 48px padding; outer edges may be obstructed.",
    appliesWhen: "storefront",
  },
];

/** Row shape for inserting into the `assets` table (snake_case columns). */
export interface GameFlowAssetRow {
  id: string;
  event_id: string;
  name: string;
  description: string;
  asset_type: string;
  required_format: string | null;
  required_dimensions: string | null;
  required_resolution_min: string | null;
  required_duration_range: string | null;
  required_file_types: string[] | null;
  safe_zone_description: string | null;
  animation_requirements: string | null;
  is_physical: boolean;
  version: number;
  status: string;
  customer_visible: boolean;
  due_date: string;
}

/**
 * Build insertable asset rows for one event from the canonical spec list.
 * Ids are deterministic (idPrefix + index) so re-applying is an idempotent
 * upsert rather than a duplicate insert.
 *
 * @param eventId   target event uuid
 * @param idPrefix  8 hex chars unique to the event, e.g. "a1f00000"
 * @param dueDate   ISO date applied to every required slot
 * @param acceptedKeys  spec keys to mark as already accepted (shows progress)
 */
export function buildGameFlowAssetRows(
  eventId: string,
  idPrefix: string,
  dueDate: string,
  acceptedKeys: string[] = []
): GameFlowAssetRow[] {
  return GAME_FLOW_ASSET_SPECS.map((spec, i) => ({
    id: `${idPrefix}-0000-4000-8000-${String(i + 1).padStart(12, "0")}`,
    event_id: eventId,
    name: spec.name,
    description: spec.description,
    asset_type: spec.assetType,
    required_format: spec.requiredFormat ?? null,
    required_dimensions: spec.requiredDimensions ?? null,
    required_resolution_min: spec.requiredResolutionMin ?? null,
    required_duration_range: spec.requiredDurationRange ?? null,
    required_file_types: spec.requiredFileTypes ?? null,
    safe_zone_description: spec.safeZoneDescription ?? null,
    animation_requirements: spec.animationRequirements ?? null,
    is_physical: spec.isPhysical ?? false,
    version: 1,
    status: acceptedKeys.includes(spec.key) ? "accepted" : "required",
    customer_visible: true,
    due_date: dueDate,
  }));
}
