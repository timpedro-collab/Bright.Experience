/** TrustBand — three big numbers + optional pull-quote.
 *
 * Replaces the ROI calculator on the public catalog: trust, not math, before
 * a price has been quoted. Numbers and quote are overridable via props so
 * the same component can be reused on /how-it-works or /partners/join.
 */
import { Quote } from "lucide-react";

import { Container, Section } from "@/components/ui/section";

interface TrustStat {
  /** Hero number, e.g. "4,800+" or "92%" */
  value: string;
  /** Short label under the number */
  label: string;
}

interface PullQuote {
  /** The quotation text without quote marks (we render them) */
  text: string;
  author: string;
  role: string;
  company?: string;
}

interface TrustBandProps {
  eyebrow?: string;
  heading?: string;
  description?: string;
  stats?: [TrustStat, TrustStat, TrustStat];
  quote?: PullQuote;
}

const DEFAULT_STATS: [TrustStat, TrustStat, TrustStat] = [
  { value: "Up to 40%", label: "More booth engagement" },
  { value: "GDPR", label: "Compliant lead capture" },
  { value: "Turnkey", label: "Delivery, creative & reporting" },
];

const DEFAULT_QUOTE: PullQuote = {
  text:
    "Bright.Blue brought our DMEXCO booth to life. The interactive machine became a magnet for attendees, giving us both a fun experience and high-quality data — automatically.",
  author: "Ioana Grapa",
  role: "Head of Global Events",
  company: "Storyblok",
};

export function TrustBand({
  eyebrow = "The proof",
  heading = "Built for brands that don't compromise.",
  description = "Real-world telemetry from every activation we run. We benchmark ourselves so you don't have to.",
  stats = DEFAULT_STATS,
  quote = DEFAULT_QUOTE,
}: TrustBandProps) {
  return (
    <Section className="border-t border-border/60">
      <Container size="lg">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-overline text-muted-foreground mb-2">{eyebrow}</p>
          <h2 className="text-heading text-3xl font-bold text-foreground md:text-4xl">
            {heading}
          </h2>
          <p className="mt-3 text-muted-foreground">{description}</p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-px overflow-hidden rounded-[var(--radius-card)] border border-white/[0.06] bg-white/[0.04] md:grid-cols-3">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="bg-[hsl(233,50%,9%)] px-6 py-10 text-center"
            >
              <p className="text-display text-5xl font-bold text-foreground tabular-nums md:text-6xl">
                {stat.value}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>

        {quote && (
          <figure className="mx-auto mt-12 max-w-3xl text-center">
            <Quote
              aria-hidden
              className="mx-auto mb-5 h-7 w-7 text-primary/70"
            />
            <blockquote className="text-heading text-xl text-balance text-foreground md:text-2xl">
              &ldquo;{quote.text}&rdquo;
            </blockquote>
            <figcaption className="mt-5 text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{quote.author}</span>
              {" · "}
              {quote.role}
              {quote.company && (
                <>
                  {" · "}
                  <span className="text-foreground/80">{quote.company}</span>
                </>
              )}
            </figcaption>
          </figure>
        )}
      </Container>
    </Section>
  );
}
