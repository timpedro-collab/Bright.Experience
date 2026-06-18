/**
 * Canonical client-logo list for public marketing surfaces.
 *
 * One source of truth shared by the landing page, catalog `LogosStrip`, and
 * any other "trusted by" treatment so the wall of brands stays consistent and
 * is easy to audit. Drop real SVG/PNG assets into `/public/logos/*` and set
 * `src` to upgrade from the monogram fallback — a deferred handoff item.
 */
export interface ClientLogo {
  name: string;
  /** Optional logo asset. Falls back to a monogram when absent. */
  src?: string;
  /**
   * Optional max-height override. Stacked logos (e.g. Pelion) read better a
   * touch taller than the wordmark default.
   */
  imgClassName?: string;
}

/**
 * Brands Bright.Blue has run activations for — mirrors the "Trusted by leading
 * brands" wall on bright.blue/events. Storyblok and Adyen also appear as named
 * testimonials (see TrustBand). Drop SVG/PNG assets into `/public/logos/*` and
 * set `src` to upgrade from the monogram fallback.
 */
/**
 * Every logo renders as a uniform white silhouette on the dark panel (see
 * `LogosStrip`) via `brightness-0 invert`. All assets are transparent PNG/SVG
 * (the Pelion and Intact marks have had their opaque white backgrounds stripped
 * so they normalise like the rest). Stacked marks can opt into a taller max-h.
 */
export const CLIENT_LOGOS: ClientLogo[] = [
  { name: "Storyblok", src: "/logos/storyblok.svg" },
  { name: "Adyen", src: "/logos/adyen.svg" },
  { name: "Red Bull", src: "/logos/red-bull.svg" },
  { name: "Pepsi", src: "/logos/pepsi.png" },
  { name: "Porsche", src: "/logos/porsche.svg" },
  { name: "Suntory", src: "/logos/suntory.svg" },
  { name: "Lucozade", src: "/logos/lucozade.png" },
  { name: "Celsius", src: "/logos/celsius.svg" },
  { name: "Pelion", src: "/logos/pelion.png", imgClassName: "max-h-11" },
  { name: "Intact", src: "/logos/intact.png" },
];
