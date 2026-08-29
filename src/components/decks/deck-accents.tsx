/**
 * Shared accents for the snapshot decks, lifted from the Bright.Blue
 * pricing design language: mono numbered eyebrows ("01", "02") and the
 * cyan-glow frame that wraps machine mockups.
 */

/** "01" — the mono numbered eyebrow from the pricing design language. */
export function MonoIndex({ index }: { index: number }) {
  return (
    <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
      {String(index + 1).padStart(2, "0")}
    </span>
  );
}

/** Cyan-glow frame for machine mockups, straight from the pricing PDF. */
export const GLOW_FRAME =
  "overflow-hidden rounded-xl border border-brand-cyan/40 [box-shadow:0_0_36px_-10px_var(--color-brand-cyan)]";
