/**
 * The Bright Index — public, ungated benchmark data from the machine fleet.
 * Median and quartile performance per venue class, refreshed from completed
 * events. The authority play: publish the numbers nobody else in experiential
 * will print, and let the market calibrate against us.
 */
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Container, Section } from "@/components/ui/section";
import { Button } from "@/components/ui/button";
import { getPublicBenchmarks } from "@/lib/queries/public-benchmarks";
import {
  shapeIndex,
  indexFreshness,
  indexSampleTotal,
  MIN_PUBLISHABLE_SAMPLE,
  type IndexEntry,
  type IndexMetricGroup,
} from "@/lib/bright-index/shape";

export const metadata: Metadata = {
  title: "The Bright Index — measured activation benchmarks",
  description:
    "What a branded machine activation actually does: median plays, opted-in leads, and dwell time per day, by venue class — published from real fleet telemetry, ungated.",
};

// Benchmarks refresh when events complete; daily revalidation is plenty.
export const revalidate = 86400;

function formatValue(value: number, unit: string): string {
  if (unit === "seconds") return `${Math.round(value)}s`;
  return Math.round(value).toLocaleString("en-GB");
}

/** Quartile range bar: p25–p75 band with the median ticked, scaled to the group max. */
function RangeBar({ entry, max }: { entry: IndexEntry; max: number }) {
  if (entry.p25 === null || entry.p75 === null || max <= 0) return null;
  const left = (entry.p25 / max) * 100;
  const width = Math.max(((entry.p75 - entry.p25) / max) * 100, 2);
  const medianAt = (entry.median / max) * 100;
  return (
    <div
      className="relative h-2 w-full rounded-full bg-muted"
      role="img"
      aria-label={`Middle half of events: ${Math.round(entry.p25)} to ${Math.round(entry.p75)}, median ${Math.round(entry.median)}`}
    >
      <div
        className="absolute top-0 h-2 rounded-full bg-[var(--color-bb-cobalt)]/25"
        style={{ left: `${left}%`, width: `${width}%` }}
      />
      <div
        className="absolute top-[-3px] h-3.5 w-[3px] rounded-full bg-[var(--color-bb-cobalt)]"
        style={{ left: `calc(${medianAt}% - 1.5px)` }}
      />
    </div>
  );
}

function MetricTable({ group }: { group: IndexMetricGroup }) {
  const max = Math.max(...group.entries.map((e) => e.p75 ?? e.median));
  return (
    <div className="rounded-2xl border border-border bg-muted/30 p-6 md:p-8">
      <div className="flex items-baseline justify-between gap-4">
        <h3 className="text-lg font-semibold text-foreground">
          {group.metricLabel}
        </h3>
        <span className="text-xs uppercase tracking-[0.15em] text-muted-foreground">
          median · middle 50% band
        </span>
      </div>
      <ul className="mt-5 space-y-4">
        {group.entries.map((entry) => (
          <li
            key={`${entry.tier ?? "all"}-${entry.machineType ?? "any"}`}
            className="grid grid-cols-[minmax(8rem,1fr)_auto] items-center gap-x-4 gap-y-2 md:grid-cols-[12rem_6rem_1fr_5rem]"
          >
            <div>
              <p className="text-sm font-medium text-foreground">
                {entry.tierLabel}
              </p>
              {entry.machineType && (
                <p className="text-xs text-muted-foreground">
                  {entry.machineType}
                </p>
              )}
            </div>
            <p className="text-right text-xl font-semibold tabular-nums tracking-tight text-foreground md:text-left">
              {formatValue(entry.median, group.unit)}
            </p>
            <div className="col-span-2 md:col-span-1">
              <RangeBar entry={entry} max={max} />
            </div>
            <p className="hidden text-right text-xs tabular-nums text-muted-foreground md:block">
              n = {entry.sampleSize}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default async function BrightIndexPage() {
  const rows = await getPublicBenchmarks();
  const sections = shapeIndex(rows);
  const freshness = indexFreshness(rows);
  const sampleTotal = indexSampleTotal(sections);

  return (
    <>
      <Section spacing="md" className="border-b border-border/60">
        <Container>
          <div className="max-w-3xl">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              The Bright Index
            </p>
            <h1 className="text-display-grotesk text-4xl text-foreground md:text-6xl">
              The numbers the rest of experiential won&rsquo;t print.
            </h1>
            <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
              Every machine in our fleet reports its own telemetry — plays,
              opted-in leads, dwell — so we can publish what an activation
              actually does, by venue class, from completed events. No
              &ldquo;up to&rdquo; numbers, no cherry-picked case study: medians
              and quartiles, refreshed as events wrap. Use them to sanity-check
              anyone&rsquo;s promises. Including ours.
            </p>
            {freshness && (
              <p className="mt-4 text-sm text-muted-foreground">
                Last refreshed{" "}
                {new Date(freshness).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
                {sampleTotal > 0 && (
                  <> · drawn from {sampleTotal}+ completed activations</>
                )}
              </p>
            )}
          </div>
        </Container>
      </Section>

      {sections.length > 0 ? (
        sections.map((section) => (
          <Section key={section.eventType} className="border-b border-border/60">
            <Container>
              <h2 className="text-display-grotesk mb-8 text-3xl text-foreground md:text-4xl">
                {section.eventTypeLabel}
              </h2>
              <div className="grid gap-6 lg:grid-cols-2">
                {section.metrics.map((group) => (
                  <MetricTable key={group.metricName} group={group} />
                ))}
              </div>
            </Container>
          </Section>
        ))
      ) : (
        <Section className="border-b border-border/60">
          <Container>
            <p className="text-muted-foreground">
              The Index publishes once a segment clears {MIN_PUBLISHABLE_SAMPLE}{" "}
              completed events. New segments are added as they mature.
            </p>
          </Container>
        </Section>
      )}

      <Section className="border-b border-border/60">
        <Container>
          <div className="grid gap-10 md:grid-cols-[1fr_1.2fr] md:items-start">
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Methodology
              </p>
              <h2 className="text-display-grotesk text-3xl text-foreground">
                How the Index is built.
              </h2>
            </div>
            <div className="space-y-4 text-sm leading-relaxed text-muted-foreground">
              <p>
                Every figure is computed from machine telemetry on completed
                events — counted plays, consented lead captures, and measured
                dwell — never from estimates or self-reported attendance. Rates
                are per event day, so a three-day trade show and a one-day
                launch compare fairly.
              </p>
              <p>
                We publish the median and the middle-50% band (25th to 75th
                percentile), which is harder to flatter than an average. A
                segment only prints once it has at least{" "}
                {MIN_PUBLISHABLE_SAMPLE} completed events behind it, and all
                figures are aggregates — no single event or client is
                identifiable.
              </p>
              <p>
                Venue classes follow our location tiers: premium (flagship
                city-centre and major-exhibition floors), major (large regional
                venues), and downwards. The same tiers drive the expectations
                we print on proposals — so what we promise up front is checked
                against this page after the event.
              </p>
            </div>
          </div>
        </Container>
      </Section>

      <Section className="border-b border-border/60">
        <Container>
          <div className="rounded-2xl border border-[var(--color-bb-cobalt)]/40 bg-[var(--color-bb-cobalt)]/[0.04] p-8 md:p-12">
            <div className="max-w-2xl">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                The annual read
              </p>
              <h2 className="text-display-grotesk text-3xl text-foreground md:text-4xl">
                State of Play 2026
              </h2>
              <p className="mt-3 text-muted-foreground leading-relaxed">
                Our annual report on measured brand activations: what the fleet
                data says about attention, lead quality, and what a play is
                worth — plus the five findings that should change how
                exhibitors budget next year. Ungated, no email wall.
              </p>
              <Button size="lg" variant="brand" className="mt-6" asChild>
                <Link href="/state-of-play">
                  Read the report
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </Container>
      </Section>

      <Section>
        <Container>
          <div className="text-center">
            <h2 className="text-display-grotesk text-3xl text-foreground md:text-4xl">
              Want your event benchmarked before you book?
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
              Tell us the venue and the dates — the proposal comes back with
              the expected range for your exact segment, drawn from this data.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Button size="lg" variant="brand" asChild>
                <Link href="/proposal">
                  Get a proposal
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="glass" asChild>
                <Link href="/pricing">See pricing</Link>
              </Button>
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}
