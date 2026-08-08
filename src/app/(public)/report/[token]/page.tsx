/**
 * Public, share-token-gated post-event report.
 *
 * Renders the customer-safe view of a published `event_reports` row. We
 * deliberately normalise every metric through `lib/reports/normalise.ts`
 * so seed/legacy/camel/snake variations all produce the same KPI numbers.
 * Internal-only metadata (cost basis, raw comparison_json, full prediction
 * estimate breakdown) stays out of this surface.
 */
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Users, Target, Eye, Star } from "lucide-react";

import { getEventReportByShareToken } from "@/lib/queries/event-reports";
import { getPartnerBrandById } from "@/lib/queries/partner-brand";
import { PartnerCoBrand } from "@/components/public/PartnerCoBrand";
import { MetricCard } from "@/components/reports/MetricCard";
import { PredictedVsActual } from "@/components/reports/PredictedVsActual";
import {
  SurveySentimentCard,
  AudienceDemographicsCard,
  DigitalFollowThroughCard,
} from "@/components/reports/EngagementReport";
import { ReportHighlights } from "@/components/reports/ReportHighlights";
import { ReportRevealHero } from "@/components/reports/ReportRevealHero";
import { CaptureQualityCard } from "@/components/reports/CaptureQualityCard";
import { RetentionNotice } from "@/components/reports/RetentionNotice";
import {
  formatSatisfactionScore,
  headlineMetricPresence,
  normaliseHighlights,
  normaliseMetrics,
  normalisePredictions,
} from "@/lib/reports/normalise";
import {
  campaignCredit,
  eventNameFromReportTitle,
  pickHeadlineStat,
} from "@/lib/reports/reveal";
import { getQuoteContactForEvent } from "@/lib/queries/quotes";
import { getEventSummaryForReport } from "@/lib/queries/event-reports";
import { getPublicBenchmarks } from "@/lib/queries/public-benchmarks";
import {
  computeIndexPlacement,
  pickComparisonRow,
} from "@/lib/bright-index/percentile";
import { eventTypeLabel } from "@/lib/bright-index/shape";
import { showDayCount } from "@/lib/metrics/expected-performance";
import { IndexPlacementChip } from "@/components/reports/IndexPlacementChip";
import { InvitationFooter } from "@/components/public/InvitationFooter";
import { recordLoopEvent } from "@/server/loop-events";

interface Props {
  params: Promise<{ token: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { token } = await params;
  const report = await getEventReportByShareToken(token);
  if (!report || !report.isPublished) {
    return { title: "Report not found" };
  }
  return {
    title: report.title ?? "Event Report",
    description: "Bright.Experience post-event proof of performance.",
  };
}

export default async function PublicReportPage({ params }: Props) {
  const { token } = await params;
  const report = await getEventReportByShareToken(token);

  if (!report || !report.isPublished) return notFound();

  // Loop pulse: every share-link open counts towards the published→viewed
  // rate on /admin/loop-pulse. Fire-and-forget — never blocks the page.
  await recordLoopEvent("report_view", {
    artifact: "report",
    eventId: report.eventId,
  });

  const brand = report.brandPartnerId
    ? await getPartnerBrandById(report.brandPartnerId)
    : null;

  const metrics = normaliseMetrics(report.metricsJson);
  const predictions = normalisePredictions(report.predictionsJson);
  const highlights = normaliseHighlights(report.highlightsJson);
  const headlineMetrics = headlineMetricPresence(metrics);
  const satisfactionScore = formatSatisfactionScore(metrics);

  const conversion =
    metrics.totalPlays > 0
      ? `${((metrics.totalLeads / metrics.totalPlays) * 100).toFixed(0)}% opt-in`
      : undefined;

  // Headline-first reveal: the biggest number, the champion's credit, and
  // the delivery lead's note come before any table or chart.
  const headlineStat = pickHeadlineStat(metrics);
  const quoteContact = headlineStat
    ? await getQuoteContactForEvent(report.eventId)
    : null;
  const credit = quoteContact ? campaignCredit(quoteContact) : null;

  // Bright Index placement: quartile band vs the pooled benchmarks, with the
  // badge when the event earned it. Silent when the comparison isn't credible.
  const eventSummary =
    metrics.totalLeads > 0
      ? await getEventSummaryForReport(report.eventId)
      : null;
  const placement = eventSummary
    ? computeIndexPlacement(
        metrics.totalLeads /
          showDayCount(eventSummary.eventDateStart, eventSummary.eventDateEnd),
        pickComparisonRow(await getPublicBenchmarks(), {
          eventType: eventSummary.eventType,
          metricName: "leads_per_day",
        }),
        {
          subjectLabel: eventTypeLabel(eventSummary.eventType).toLowerCase(),
          metricLabel: "opted-in leads per day",
        }
      )
    : null;

  return (
    <div className="min-h-screen bg-background">
      {brand && (
        <div
          className="h-0.5 w-full"
          style={{ backgroundColor: brand.brandColor ?? undefined }}
        />
      )}
      <div className="mx-auto max-w-5xl px-6 py-12">
        <div className="flex items-center gap-3 mb-10">
          {brand ? (
            <Link href="/catalog" className="flex items-center gap-3">
              <PartnerCoBrand
                name={brand.name}
                logoUrl={brand.logoUrl}
                accent={brand.brandColor}
                variant="lockup"
                size="md"
              />
            </Link>
          ) : (
            <Link href="/catalog" className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand text-white font-bold text-sm">
                B
              </div>
              <span className="text-heading text-sm font-semibold text-foreground">
                Bright.Experience
              </span>
            </Link>
          )}
          <span className="text-xs text-muted-foreground ml-auto">
            Proof of Performance
          </span>
        </div>

        <div className="mb-8">
          <h1 className="text-display text-3xl text-foreground mb-1 md:text-4xl">
            {report.title ?? "Event Report"}
          </h1>
        </div>

        {headlineStat && (
          <ReportRevealHero
            stat={headlineStat}
            credit={credit}
            note={
              report.personalNote
                ? {
                    text: report.personalNote,
                    author: report.personalNoteAuthor ?? "The Bright.Blue team",
                  }
                : null
            }
          />
        )}

        {headlineStat && (
          <div className="mb-8 -mt-4 space-y-2">
            {placement && <IndexPlacementChip placement={placement} />}
            <p className="text-sm text-muted-foreground">
              <Link
                href={`/report/${token}/wrapped`}
                className="text-brand hover:underline"
              >
                See it wrapped →
              </Link>{" "}
              — the story version, ready to post.
            </p>
          </div>
        )}

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <MetricCard
            icon={Users}
            label="Total plays"
            value={metrics.totalPlays.toLocaleString("en-US")}
          />
          <MetricCard
            icon={Target}
            label="Leads"
            value={metrics.totalLeads.toLocaleString("en-US")}
            delta={conversion}
            positive
          />
          {headlineMetrics.footfallImpressions && (
            <MetricCard
              icon={Eye}
              label="Footfall impressions"
              value={metrics.mediaImpressions.toLocaleString("en-US")}
            />
          )}
          {headlineMetrics.satisfaction && satisfactionScore && (
            <MetricCard
              icon={Star}
              label="Satisfaction"
              value={satisfactionScore}
            />
          )}
        </div>

        {(predictions.estimatedInteractions !== null ||
          predictions.estimatedLeads !== null) && (
          <div className="mb-8">
            <PredictedVsActual
              predictions={{
                interactions: predictions.estimatedInteractions ?? 0,
                leads: predictions.estimatedLeads ?? 0,
                impressions: predictions.estimatedImpressions ?? 0,
              }}
              actuals={{
                interactions: metrics.totalInteractions,
                leads: metrics.totalLeads,
                impressions: metrics.mediaImpressions,
              }}
            />
          </div>
        )}

        {(metrics.survey.length > 0 || metrics.npsScore != null) && (
          <div className="mb-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SurveySentimentCard
              survey={metrics.survey}
              npsScore={metrics.npsScore}
            />
            <AudienceDemographicsCard demographics={metrics.demographics} />
          </div>
        )}

        {(metrics.socialShares != null ||
          metrics.qrScans != null ||
          metrics.totalSamples != null) && (
          <div className="mb-8">
            <DigitalFollowThroughCard
              socialShares={metrics.socialShares}
              qrScans={metrics.qrScans}
              totalSamples={metrics.totalSamples}
            />
          </div>
        )}

        {metrics.captureQuality && (
          <div className="mb-8 max-w-xl">
            <CaptureQualityCard counts={metrics.captureQuality} />
          </div>
        )}

        {highlights.length > 0 && (
          <div className="mb-8">
            <ReportHighlights highlights={highlights} />
          </div>
        )}

        <footer className="mt-12 pt-6 border-t border-glass-border/10 text-center">
          {/* An invitation, not a credit — the reader is the next buyer. */}
          <InvitationFooter
            artifact="report"
            fromEvent={eventNameFromReportTitle(report.title)}
            className="mb-6"
          />
          {/* Public surface has no config access; states the standard window. */}
          <div className="mb-3">
            <RetentionNotice />
          </div>
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} Bright.Blue Events. All rights
            reserved.
          </p>
          {brand && (
            <p className="text-xs text-muted-foreground mt-1">
              Prepared by {brand.name} · Powered by{" "}
              <Link href="/catalog" className="text-brand hover:underline">
                Bright.Experience
              </Link>
            </p>
          )}
        </footer>
      </div>
    </div>
  );
}
