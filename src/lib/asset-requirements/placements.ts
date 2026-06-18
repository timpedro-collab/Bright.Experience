/**
 * On-machine preview mapping.
 *
 * Ported from the Cloud Media Library preview. Each placement is described
 * by two rectangles, both expressed as a percentage of the (square) machine
 * render:
 *
 *  - `overlay`  — the exact area the customer's creative occupies on the
 *                 machine (e.g. the full main display, the top banner strip,
 *                 or the little card-reader screen).
 *  - `viewport` — the region the preview *zooms into* to frame that placement
 *                 with a little surrounding hardware for context. The preview
 *                 glides from the full machine to this rect.
 *
 * Keyed by the asset slot's `name` (matches the seeded `assets.name`). The
 * catalog is intentionally data-only so swapping in bespoke Bright.Blue
 * machine art later is a per-placement one-liner.
 */

export interface Rect {
  /** Left edge, as a % of the render width. */
  x: number;
  /** Top edge, as a % of the render height. */
  y: number;
  /** Width, as a % of the render width. */
  w: number;
  /** Height, as a % of the render height. */
  h: number;
}

export interface PlacementPreview {
  /** Backdrop machine render (served from /public). */
  screenImage: string;
  /** Exact rect the creative fills on the render. */
  overlay: Rect;
  /** Region the preview zooms into to frame the placement. */
  viewport: Rect;
  /** How the creative fills its overlay rect. Defaults to "cover". */
  fit?: "cover" | "contain";
  /** Short caption shown under the preview. */
  caption: string;
}

export const FULL_VIEWPORT: Rect = { x: 0, y: 0, w: 100, h: 100 };

/*
 * The machine render is intentionally a single swappable constant. When the
 * bespoke Bright.Blue cabinet art arrives, drop it in `/public/machine/` and
 * point `MACHINE_RENDER` at it, then recalibrate the rects below against the
 * new artwork — every placement references this one source, so nothing else
 * needs to change. (`kiosk.png` is the calibrated 1024×1024 stand-in.)
 */
export const MACHINE_RENDER = "/machine/kiosk.png";
const KIOSK = MACHINE_RENDER;

/*
 * Calibrated against `public/machine/kiosk.png` (a 1024×1024 render).
 * The banner rect is taken verbatim from the Cloud preview metadata; the
 * full-screen and card-reader rects were measured from the same artwork.
 */
const SCREEN_FULL: Rect = { x: 30.9, y: 10.5, w: 30.8, h: 55.5 };
const SCREEN_BANNER: Rect = { x: 31, y: 10.5, w: 30.5, h: 10 };
const CARD_READER: Rect = { x: 65.5, y: 40.4, w: 3.4, h: 4.8 };
// A centred area of the main screen used for cut-out / icon style assets.
const SCREEN_CENTRE: Rect = { x: 34, y: 22, w: 24, h: 32 };
// The cabinet body — used to preview the physical machine wrap.
const CABINET_BODY: Rect = { x: 27, y: 8, w: 40, h: 86 };

// Zoom framings — wider than the overlay so a little of the machine shows.
const VIEW_FULL_MACHINE: Rect = { x: 22, y: 4, w: 56, h: 92 };
const VIEW_BANNER: Rect = { x: 18, y: 3, w: 56, h: 26 };
const VIEW_CARD_READER: Rect = { x: 58, y: 34, w: 18, h: 18 };

export const PLACEMENT_PREVIEWS: Record<string, PlacementPreview> = {
  "Idle Screen Advert": {
    screenImage: KIOSK,
    overlay: SCREEN_FULL,
    viewport: VIEW_FULL_MACHINE,
    fit: "cover",
    caption: "Full-screen attract loop on the machine",
  },
  "Game Prompt Video": {
    screenImage: KIOSK,
    overlay: SCREEN_FULL,
    viewport: VIEW_FULL_MACHINE,
    fit: "cover",
    caption: "Full-screen on the machine",
  },
  "Game Page Banner": {
    screenImage: KIOSK,
    overlay: SCREEN_BANNER,
    viewport: VIEW_BANNER,
    fit: "cover",
    caption: "Banner across the top of the screen",
  },
  "Payment Terminal Screen": {
    screenImage: KIOSK,
    overlay: CARD_READER,
    viewport: VIEW_CARD_READER,
    fit: "cover",
    caption: "On the card-payment screen",
  },
  "Machine Wrap Artwork": {
    screenImage: KIOSK,
    overlay: CABINET_BODY,
    viewport: VIEW_FULL_MACHINE,
    fit: "cover",
    caption: "Wrapped across the machine body",
  },
  "Product Packshot": {
    screenImage: KIOSK,
    overlay: SCREEN_CENTRE,
    viewport: VIEW_FULL_MACHINE,
    fit: "contain",
    caption: "Featured in the game flow",
  },
  "Home Banner Ad": {
    screenImage: KIOSK,
    overlay: SCREEN_BANNER,
    viewport: VIEW_BANNER,
    fit: "cover",
    caption: "Storefront hero banner",
  },
  "Primary Brand Logo": {
    screenImage: KIOSK,
    overlay: SCREEN_CENTRE,
    viewport: VIEW_FULL_MACHINE,
    fit: "contain",
    caption: "Across digital touchpoints",
  },
  "Negative Icons (×6)": {
    screenImage: KIOSK,
    overlay: SCREEN_CENTRE,
    viewport: VIEW_FULL_MACHINE,
    fit: "contain",
    caption: "Distractor icons in the game flow",
  },
};

/**
 * Lookup the on-machine preview config for an asset slot, if any.
 *
 * Backward-compatible entry point: returns the default-variant geometry. New
 * machine-variant-aware call sites should use `placementPreviewForMachine` /
 * `slotForAsset` from `./machine-placements`.
 */
export function placementPreviewFor(assetName: string): PlacementPreview | null {
  return PLACEMENT_PREVIEWS[assetName] ?? null;
}
