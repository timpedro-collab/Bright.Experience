/**
 * State of Play 2026 — the annual, ungated report on measured brand
 * activations. Long-form editorial built on the same fleet aggregates as the
 * Bright Index, plus the findings a budget-holder should act on. Authority
 * play: the industry publishes vibes; we publish telemetry.
 */
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Container, Section } from "@/components/ui/section";
import { Button } from "@/components/ui/button";
import { TRUST_STATS } from "@/lib/marketing/claims";
import { getPublicBenchmarks } from "@/lib/queries/public-benchmarks";
import { shapeIndex, indexFreshness } from "@/lib/bright-index/shape";

export const metadata: Metadata = {
  title: "State of Play 2026 — the measured activation report",
  description:
    "What machine telemetry from real brand activations says about attention, dwell, lead quality, and what a play is worth. The annual report, ungated.",
};

export const revalidate = 86400;

const FINDINGS = [
  {
    number: "01",
    title: "Attention is earned by play, not handed out",
    body: "People dodge staff with clipboards and accept flyers they never read. They queue for a game. Across the fleet, the median activation holds each player for the better part of a minute of undivided, brand-wrapped attention — a number most digital media buys can't reach at any price. The mechanism matters: when the prize has to be won, taking part is a choice, and chosen attention is the kind that converts.",
  },
  {
    number: "02",
    title: "Most sampling budgets still buy zero data",
    body: "Traditional sampling remains the least measured line in the marketing budget: product goes out by the pallet and the report says \"we think it went well.\" Less than 1% of hand-to-hand sampling produces an attributable record. Every machine-dispensed sample, by contrast, is counted, timestamped, and — where the brand wants it — tied to an opted-in contact. In 2026, running unmeasured sampling is a decision, not a default.",
  },
  {
    number: "03",
    title: "Lead volume is a vanity metric; verified leads are the asset",
    body: "Badge scans and fishbowl business cards inflate the post-event count and deflate the sales team's trust. When capture happens at the machine — one consent screen between play and prize — the list is smaller on paper and larger in practice: real addresses, explicit consent, and a screening layer that strips disposable domains and repeat players before the CRM ever sees them. Procurement should ask every vendor one question: how many of these leads are verified?",
  },
  {
    number: "04",
    title: "Venue class moves the numbers more than machine choice",
    body: "The spread between a premium flagship floor and a regional venue is consistently wider than the spread between machine formats at the same venue. The budgeting implication runs against instinct: pick the venue tier first, then the machine. The Bright Index publishes the per-day medians by venue class precisely so this trade-off can be made on evidence rather than on a sales deck.",
  },
  {
    number: "05",
    title: "The report is the product",
    body: "The activations that get rebooked are not the ones with the biggest crowds — they are the ones whose results survived the internal meeting three weeks later. A board-ready proof-of-performance report, delivered within a day of wrap and benchmarked against comparable events, is what turns an experiential line item from \"brand spend\" into a channel with a cost per lead. Our own rebook rate is the cleanest evidence we have.",
  },
];

export default async function StateOfPlayPage() {
  const rows = await getPublicBenchmarks();
  const sections = shapeIndex(rows);
  const freshness = indexFreshness(rows);
  const activation = sections.find((s) => s.eventType === "activation");
  const playsGroup = activation?.metrics.find(
    (m) => m.metricName === "plays_per_day"
  );
  const leadsGroup = activation?.metrics.find(
    (m) => m.metricName === "leads_per_day"
  );
  const topPlays = playsGroup?.entries[0];
  const topLeads = leadsGroup?.entries[0];

  return (
    <>
      <Section spacing="md" className="border-b border-border/60">
        <Container>
          <div className="max-w-3xl">
            <p className="text-overline text-brand-cyan mb-3">
              State of Play · 2026 edition
            </p>
            <h1 className="text-display-grotesk text-4xl text-foreground md:text-6xl">
              What measured activations tell us that gut feel never could.
            </h1>
            <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
              Most of the experiential industry reports its results in
              adjectives. Our machines report theirs in telemetry — every play,
              every consented lead, every second of dwell, on every completed
              event. This is the annual read of that data: what it says about
              attention, lead quality, and where the budget actually works.
              Ungated, because numbers behind an email wall aren&rsquo;t
              numbers, they&rsquo;re bait.
            </p>
            {freshness && (
              <p className="mt-4 text-sm text-muted-foreground">
                Data through{" "}
                {new Date(freshness).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}{" "}
                · full tables on{" "}
                <Link
                  href="/bright-index"
                  className="underline underline-offset-4 hover:text-foreground"
                >
                  the Bright Index
                </Link>
              </p>
            )}
          </div>
        </Container>
      </Section>

      <Section className="border-b border-border/60">
        <Container>
          <p className="text-overline text-muted-foreground mb-8">
            The year in three numbers
          </p>
          <div className="grid gap-6 md:grid-cols-3">
            {topPlays && (
              <div className="rounded-[var(--radius-card)] border border-border bg-muted/40 p-8">
                <p className="text-4xl font-semibold tabular-nums tracking-tight text-foreground">
                  {Math.round(topPlays.median).toLocaleString("en-GB")}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  median plays per day at {topPlays.tierLabel.toLowerCase()} —
                  each one a person who chose to stop
                </p>
              </div>
            )}
            {topLeads && (
              <div className="rounded-[var(--radius-card)] border border-border bg-muted/40 p-8">
                <p className="text-4xl font-semibold tabular-nums tracking-tight text-foreground">
                  {Math.round(topLeads.median).toLocaleString("en-GB")}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  median opted-in leads per day at the same venues — consent
                  screen included, always
                </p>
              </div>
            )}
            <div className="rounded-[var(--radius-card)] border border-border bg-muted/40 p-8">
              <p className="text-4xl font-semibold tabular-nums tracking-tight text-foreground">
                {TRUST_STATS[0].value}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {TRUST_STATS[0].label} — the strongest signal that measured
                activations pay for themselves
              </p>
            </div>
          </div>
        </Container>
      </Section>

      <Section className="border-b border-border/60">
        <Container>
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-overline text-muted-foreground mb-3">
              The findings
            </p>
            <h2 className="text-display-grotesk text-3xl text-foreground md:text-5xl text-balance">
              Five things the data insists on.
            </h2>
          </div>
          <div className="mx-auto mt-14 max-w-3xl space-y-10">
            {FINDINGS.map((finding) => (
              <article
                key={finding.number}
                className="grid gap-4 md:grid-cols-[4rem_1fr]"
              >
                <p className="text-2xl font-semibold tabular-nums text-primary/60">
                  {finding.number}
                </p>
                <div>
                  <h3 className="text-xl font-semibold text-foreground">
                    {finding.title}
                  </h3>
                  <p className="mt-2 leading-relaxed text-muted-foreground">
                    {finding.body}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </Container>
      </Section>

      <Section className="border-b border-border/60">
        <Container>
          <div className="grid gap-10 md:grid-cols-[1fr_1.2fr] md:items-start">
            <div>
              <p className="text-overline text-muted-foreground mb-3">
                Where the data comes from
              </p>
              <h2 className="text-display-grotesk text-3xl text-foreground">
                Methodology, briefly.
              </h2>
            </div>
            <div className="space-y-4 text-sm leading-relaxed text-muted-foreground">
              <p>
                Every machine in the fleet reports its own telemetry: plays,
                interactions, lead captures with consent records, prize and
                sample dispenses, and dwell time. Figures in this report are
                aggregates across completed events, normalised per event day,
                and published as medians with quartile bands — the same
                pipeline that powers{" "}
                <Link
                  href="/bright-index"
                  className="underline underline-offset-4 hover:text-foreground"
                >
                  the Bright Index
                </Link>
                . No segment prints below five completed events, and no single
                event or client is identifiable.
              </p>
              <p>
                Claims that come from our commercial record rather than machine
                telemetry — like the rebook rate — are portfolio-level figures
                verified with the commercial team, never single-client numbers
                published without written approval.
              </p>
            </div>
          </div>
        </Container>
      </Section>

      <Section>
        <Container>
          <div className="rounded-[var(--radius-card)] border border-border bg-muted/30 p-8 text-center md:p-12">
            <h2 className="text-display-grotesk text-3xl text-foreground md:text-4xl">
              Put your next event on the right side of the data.
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
              Tell us the venue, the audience, and what success looks like —
              the proposal comes back with expected ranges from the same
              benchmarks you&rsquo;ve just read.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Button size="lg" variant="brand" asChild>
                <Link href="/proposal">
                  Get a proposal
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="glass" asChild>
                <Link href="/bright-index">Browse the Index</Link>
              </Button>
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}
