/**
 * Shared visual primitives for the confidential commercial-plan slides,
 * following the dark Local Services presentation language.
 */

import { cn } from "@/lib/utils";

/** Full-screen content frame with room for DeckShell navigation. */
export function CommercialSlideFrame({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "mx-auto flex w-full max-w-7xl flex-1 flex-col justify-center px-6 pb-24 pt-10 sm:px-12 lg:px-16",
        className
      )}
    >
      {children}
    </section>
  );
}

/** Cyan mono eyebrow used above each slide headline. */
export function CommercialOverline({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--color-bb-cyan)]">
      {children}
    </p>
  );
}

/** Two-digit mono index used on columns and proof panels. */
export function CommercialIndex({ index }: { index: number }) {
  return (
    <span className="font-mono text-[10px] font-semibold tracking-[0.18em] text-[var(--color-bb-cobalt)]">
      {String(index + 1).padStart(2, "0")}
    </span>
  );
}

/** Shared stagger parent for restrained slide-entry animation. */
export const commercialStagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.12 } },
};

/** Shared child rise for restrained slide-entry animation. */
export const commercialRise = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.45,
      ease: [0.16, 1, 0.3, 1] as const,
    },
  },
};
