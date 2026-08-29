/**
 * Event Wrapped — the story-format post-event page the marketer shares to
 * make themselves look good. Same share token as the report; renders
 * nothing the shared report doesn't already show.
 */
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Award } from "lucide-react";

import {
  getEventReportByShareToken,
  getEventSummaryForReport,
} from "@/lib/queries/event-reports";
import { getQuoteContactForEvent } from "@/lib/queries/quotes";
import { getPublicBenchmarks } from "@/lib/queries/public-benchmarks";
import {
  normaliseHighlights,
  normaliseMetrics,
} from "@/lib/reports/normalise";
import { campaignCredit } from "@/lib/reports/reveal";
import { buildWrappedStory } from "@/lib/reports/wrapped";
import { WrappedShareActions } from "@/components/reports/WrappedShareActions";
import { InvitationFooter } from "@/components/public/InvitationFooter";

interface Props {
  params: Promise<{ token: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { token } = await params;
  const report = await getEventReportByShareToken(token);
  if (!report || !report.isPublished) return { title: "Not found" };
  const event = await getEventSummaryForReport(report.eventId);
  return {
    title: event ? `${event.name} — Wrapped` : "Event Wrapped",
    description: "Your activation, wrapped — the story of what it did.",
    openGraph: {
      images: [`/api/reports/${token}/wrapped-card`],
    },
    robots: { index: false, follow: false },
  };
}

export default async function WrappedPage({ params }: Props) {
  const { token } = await params;
  const report = await getEventReportByShareToken(token);
  if (!report || !report.isPublished) return notFound();

  const [event, benchmarks, quoteContact] = await Promise.all([
    getEventSummaryForReport(report.eventId),
    getPublicBenchmarks(),
    getQuoteContactForEvent(report.eventId),
  ]);
  if (!event) return notFound();

  const story = buildWrappedStory({
    eventName: event.name,
    eventType: event.eventType,
    eventDateStart: event.eventDateStart,
    eventDateEnd: event.eventDateEnd,
    metrics: normaliseMetrics(report.metricsJson),
    personalNote: report.personalNote,
    personalNoteAuthor: report.personalNoteAuthor,
    highlights: normaliseHighlights(report.highlightsJson),
    credit: quoteContact ? campaignCredit(quoteContact) : null,
    benchmarks,
  });
  // A wrapped with nothing to brag about would damage more than it delights.
  if (!story) return notFound();

  return (
    // Cinematic year-in-review surface — force-Ink via `theme-dark` so it
    // stays near-black even when the viewer prefers Ink Light.
    <div className="theme-dark min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-3xl px-6 py-16 sm:py-24">
        {/* Act 1 — the setup */}
        <header className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-brand-cyan">
            Your activation, wrapped
          </p>
          <h1 className="mt-4 text-4xl font-bold leading-tight sm:text-5xl">
            {story.eventName}
          </h1>
          {story.credit && (
            <p className="mt-3 text-sm text-muted-foreground">{story.credit}</p>
          )}
        </header>

        {/* Act 2 — the number (the page's single gradient hero stat) */}
        <section className="mt-20 text-center sm:mt-28">
          <p className="text-brand-gradient text-[clamp(4.5rem,16vw,9rem)] font-bold leading-none tabular-nums">
            {story.headline.value}
          </p>
          <p className="mt-3 text-xl text-muted-foreground sm:text-2xl">
            {story.headline.label}
          </p>
          {story.headline.support && (
            <p className="text-tertiary mt-2 text-sm">
              {story.headline.support}
            </p>
          )}
          {story.optInLine && (
            <p className="mt-6 inline-block rounded-full border border-border px-4 py-1.5 text-sm text-muted-foreground">
              {story.optInLine}
            </p>
          )}
        </section>

        {/* Act 3 — where it sits on the index */}
        {story.placement && (
          <section className="mt-20 text-center sm:mt-28">
            {story.placement.badge ? (
              <div className="inline-flex flex-col items-center gap-4 rounded-[var(--radius-card)] border border-brand-cyan/40 bg-brand-cyan/5 px-10 py-8">
                <Award size={36} className="text-brand-cyan" strokeWidth={1.5} />
                <p className="text-2xl font-bold text-brand-cyan">
                  {story.placement.badge}
                </p>
                <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
                  {story.placement.label}, measured on {story.placement.metricLabel}{" "}
                  across {story.placement.sampleSize} comparable events.
                </p>
              </div>
            ) : (
              <p className="mx-auto max-w-md text-lg leading-relaxed text-muted-foreground">
                {story.placement.label} — measured on{" "}
                {story.placement.metricLabel} across{" "}
                {story.placement.sampleSize} comparable events.
              </p>
            )}
            <p className="text-quaternary mt-4 text-xs">
              <Link
                href="/bright-index"
                className="underline underline-offset-4 hover:text-muted-foreground"
              >
                How the Bright Index places events
              </Link>
            </p>
          </section>
        )}

        {/* Act 4 — the human moment */}
        {story.humanMoment && (
          <section className="mt-20 text-center sm:mt-28">
            <blockquote className="mx-auto max-w-lg text-xl italic leading-relaxed text-foreground/85">
              &ldquo;{story.humanMoment.text}&rdquo;
            </blockquote>
            {story.humanMoment.author && (
              <p className="text-tertiary mt-4 text-sm">
                — {story.humanMoment.author}, Bright.Blue delivery team
              </p>
            )}
          </section>
        )}

        {/* Act 5 — share it */}
        <section className="mt-20 sm:mt-28">
          <div className="rounded-[var(--radius-card)] border border-border bg-card p-8 text-center">
            <p className="text-tertiary text-xs font-semibold uppercase tracking-[0.3em]">
              Post it
            </p>
            <p className="mx-auto mt-4 max-w-lg text-base leading-relaxed text-foreground/85">
              {story.shareText}
            </p>
            <div className="mt-6">
              <WrappedShareActions
                shareText={story.shareText}
                cardUrl={`/api/reports/${token}/wrapped-card`}
              />
            </div>
          </div>
        </section>

        <footer className="mt-16 space-y-6 text-center">
          <Link
            href={`/report/${token}`}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft size={14} />
            See the full report
          </Link>
          {/* Page root is already `theme-dark` — no extra scope needed. */}
          <InvitationFooter artifact="wrapped" fromEvent={story.eventName} />
        </footer>
      </div>
    </div>
  );
}
