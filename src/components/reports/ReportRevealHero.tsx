/**
 * ReportRevealHero — the report opens on one enormous number, not chrome.
 *
 * The reveal moment: headline stat first, the champion's name on the result,
 * and (when the delivery lead wrote one) a personal note under it. Shared by
 * the portal report and the public share page so both lead the same way.
 */
import type { HeadlineStat } from "@/lib/reports/reveal";

interface ReportRevealHeroProps {
  stat: HeadlineStat;
  /** "Campaign led by Sarah Whitmore, Marketing — Acme" or null. */
  credit?: string | null;
  /** Personal note from the delivery lead, shown as a signed aside. */
  note?: { text: string; author: string } | null;
}

export function ReportRevealHero({ stat, credit, note }: ReportRevealHeroProps) {
  return (
    <section className="py-10 text-center">
      <p className="text-display text-6xl font-bold tabular-nums leading-none text-foreground md:text-8xl">
        {stat.value}
      </p>
      <p className="mt-3 text-lg font-medium text-[var(--color-bb-cobalt)]">
        {stat.label}
      </p>
      {stat.support && (
        <p className="mt-1 text-sm text-muted-foreground">{stat.support}</p>
      )}
      {credit && (
        <p className="mt-5 text-sm font-medium text-foreground/80">{credit}</p>
      )}
      {note && (
        <figure className="mx-auto mt-8 max-w-xl rounded-[var(--radius-card)] border border-border/60 bg-card/40 px-6 py-5 text-left">
          <blockquote className="text-sm leading-relaxed text-foreground/90">
            {note.text}
          </blockquote>
          <figcaption className="mt-3 text-xs text-muted-foreground">
            — {note.author}, Bright.Blue
          </figcaption>
        </figure>
      )}
    </section>
  );
}
