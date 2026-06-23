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
import { MetricCard } from "@/components/reports/MetricCard";
import { PredictedVsActual } from "@/components/reports/PredictedVsActual";
import {
  SurveySentimentCard,
  AudienceDemographicsCard,
  DigitalFollowThroughCard,
} from "@/components/reports/EngagementReport";
import { ReportHighlights } from "@/components/reports/ReportHighlights";
import {
  normaliseHighlights,
  normaliseMetrics,
  normalisePredictions,
} from "@/lib/reports/normalise";

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

  const metrics = normaliseMetrics(report.metricsJson);
  const predictions = normalisePredictions(report.predictionsJson);
  const highlights = normaliseHighlights(report.highlightsJson);

  const conversion =
    metrics.totalPlays > 0
      ? `${((metrics.totalLeads / metrics.totalPlays) * 100).toFixed(0)}% opt-in`
      : undefined;

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-5xl px-6 py-12">
        <div className="flex items-center gap-3 mb-10">
          <Link href="/catalog" className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand text-white font-bold text-sm">
              B
            </div>
            <span className="text-heading text-sm font-semibold text-foreground">
              Bright.Experience
            </span>
          </Link>
          <span className="text-xs text-muted-foreground ml-auto">
            Proof of Performance
          </span>
        </div>

        <div className="mb-8">
          <h1 className="text-display text-3xl text-foreground mb-1 md:text-4xl">
            {report.title ?? "Event Report"}
          </h1>
        </div>

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
          <MetricCard
            icon={Eye}
            label="Footfall impressions"
            value={metrics.mediaImpressions.toLocaleString("en-US")}
          />
          <MetricCard
            icon={Star}
            label="Satisfaction"
            value={
              metrics.npsScore != null
                ? `${metrics.npsScore.toFixed(1)} / 5`
                : "—"
            }
          />
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

        {highlights.length > 0 && (
          <div className="mb-8">
            <ReportHighlights highlights={highlights} />
          </div>
        )}

        <footer className="mt-12 pt-6 border-t border-glass-border/10 text-center">
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} Bright.Blue Events. All rights
            reserved.
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Powered by{" "}
            <Link href="/catalog" className="text-brand hover:underline">
              Bright.Experience
            </Link>
          </p>
        </footer>
      </div>
    </div>
  );
}
