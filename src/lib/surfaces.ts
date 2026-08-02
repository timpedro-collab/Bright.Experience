/**
 * Shared className constants for the Cloud "frosted glass" surface aesthetic.
 *
 * Ported from the TheoCloud redesign's `lib/surfaces.ts`, but adapted to this
 * app's theming model: the redesign used Tailwind `dark:` variants (class
 * strategy), whereas Bright.Experience themes via semantic CSS tokens that
 * remap under `.theme-light`. So these constants are expressed in SEMANTIC
 * tokens (`bg-card`, `border-border`, `text-foreground`, ...) and pick up the
 * light/dark switch automatically — no `dark:` variants needed.
 */

/**
 * Signature large rounded Cloud card. Crisp + solid (white in light,
 * slate-900 in dark) with a soft shadow — matching the Cloud redesign's
 * `bg-white / bg-slate-950` cards rather than a muddy translucent glass.
 */
export const SURFACE_CARD =
  "rounded-[var(--radius-glass)] border border-border bg-card shadow-sm";
/** Pill-shaped nav / filter chrome. */
export const SURFACE_PILL =
  "rounded-full border border-border bg-card shadow-sm";

/** Section header strip inside a card. */
export const SURFACE_SECTION_HEADER =
  "border-b border-border bg-muted/40";
