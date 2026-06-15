/** Proof of Performance — post-event reporting with metrics, benchmarks, and sharing. */
import { notFound, redirect } from "next/navigation";
import {
  BarChart3,
  Users,
  Target,
  Eye,
  DollarSign,
} from "lucide-react";

import { EventPageShell, EditorialEyebrow, Hairline } from "@/components/brand";
import { EmptyState } from "@/components/ui/EmptyState";
import { MetricCard } from "@/components/reports/MetricCard";
import { PredictedVsActual } from "@/components/reports/PredictedVsActual";
import { BenchmarkComparison } from "@/components/reports/BenchmarkComparison";
import { ReportHighlights } from "@/components/reports/ReportHighlights";
import { ShareableReportBanner } from "@/components/reports/ShareableReportBanner";
import { RebookCTA } from "@/components/reports/RebookCTA";
import { DashboardTabs } from "@/components/reports/DashboardTabs";
import { ExportMenu } from "@/components/ui/ExportMenu";

import { getUnreadCount } from "@/lib/queries/notifications";
import { getEventById } from "@/lib/queries/events";
import { getEventReports } from "@/lib/queries/event-reports";
import { getLatestEventMetrics } from "@/lib/queries/event-metrics";
import { getBenchmarkForComparison } from "@/lib/queries/benchmarks";
import { GenerateReportButton, PublishReportBanner } from "@/components/reports/ReportActions";
import { ScheduledExportManager } from "@/components/reports/ScheduledExportManager";
import { getScheduledExports } from "@/app/actions/scheduled-exports";
import { getUser } from "@/lib/auth";
import { isInternalRole } from "@/lib/roles";
import {
  costPerLeadPence,
  normaliseHighlights,
  normaliseMetrics,
  normalisePredictions,
} from "@/lib/reports/normalise";

/**
 * Whether the event's end (or start, if no end) is in the past. Kept as a
 * module-level helper so the time read isn't an impure call in render.
 */
function hasEventEnded(event: {
  eventDateEnd?: string | null;
  eventDateStart: string;
}): boolean {
  const ref = event.eventDateEnd ?? event.eventDateStart;
  return new Date(ref).getTime() < Date.now();
}

export default async function ReportsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getUser();
  if (!user) redirect("/login");
  const { id } = await params;
  const [event, reports, unread] = await Promise.all([
    getEventById(id),
    getEventReports(id),
    getUnreadCount(user.id),
  ]);
  const isInternal = isInternalRole(user.role);
  if (!event) return notFound();

  const report = reports?.[0] ?? null;

  if (!report) {
    const eventEnded = hasEventEnded(event);

    const customerDescription = eventEnded
      ? "Your report is being generated and will be ready for review shortly."
      : "Your proof-of-performance report is being prepared. Check back soon.";

    return (
      <EventPageShell
        event={event}
        user={user}
        unreadCount={unread}
        section="Reports"
        title="Proof of performance."
        subtitle="Post-event reporting, ROI insights, and shareable summaries."
        isInternal={isInternal}
        viewerRole={user.role}
      >
        <section className="py-8">
          <EmptyState
            icon={BarChart3}
            title="No report generated yet"
            description={
              isInternal
                ? "Generate a proof-of-performance report once post-event data has been collected."
                : customerDescription
            }
          />
          {isInternal && <GenerateReportButton eventId={id} />}
        </section>
      </EventPageShell>
    );
  }

  if (!report.isPublished && !isInternal) {
    return (
      <EventPageShell
        event={event}
        user={user}
        unreadCount={unread}
        section="Reports"
        title="Proof of performance."
        subtitle="Post-event reporting, ROI insights, and shareable summaries."
        isInternal={isInternal}
        viewerRole={user.role}
      >
        <section className="py-8">
          <EmptyState
            icon={BarChart3}
            title="Your report is being finalised"
            description="Your report is being finalized by the team. You'll be notified as soon as it's ready to view."
          />
        </section>
      </EventPageShell>
    );
  }

  const [latestMetrics, benchmarkList] = await Promise.all([
    getLatestEventMetrics(id),
    getBenchmarkForComparison(event.eventType ?? "experiential"),
  ]);

  // Prefer live telemetry snapshot over the report blob when both exist —
  // the snapshot keeps refreshing during/after the event.
  const liveMetrics = normaliseMetrics(latestMetrics ?? {});
  const reportMetrics = normaliseMetrics(report.metricsJson);
  const metrics = {
    ...reportMetrics,
    totalPlays: liveMetrics.totalPlays || reportMetrics.totalPlays,
    totalLeads: liveMetrics.totalLeads || reportMetrics.totalLeads,
    totalInteractions:
      liveMetrics.totalInteractions || reportMetrics.totalInteractions,
    mediaImpressions:
      liveMetrics.mediaImpressions || reportMetrics.mediaImpressions,
  };
  const predictions = normalisePredictions(report.predictionsJson);
  const highlights = normaliseHighlights(report.highlightsJson);
  const cpl = costPerLeadPence(metrics);

  // Shape the metric records consumed by PredictedVsActual + BenchmarkComparison.
  const metricsRecord: Record<string, number> = {
    interactions: metrics.totalInteractions,
    leads: metrics.totalLeads,
    impressions: metrics.mediaImpressions,
  };
  const predictionsRecord: Record<string, number> = {};
  if (predictions.estimatedInteractions !== null) {
    predictionsRecord.interactions = predictions.estimatedInteractions;
  }
  if (predictions.estimatedLeads !== null) {
    predictionsRecord.leads = predictions.estimatedLeads;
  }
  if (predictions.estimatedImpressions !== null) {
    predictionsRecord.impressions = predictions.estimatedImpressions;
  }

  const benchmarkMap: Record<string, number> = {};
  for (const b of benchmarkList) {
    benchmarkMap[b.metricName] = b.avgValue ?? 0;
  }

  return (
    <EventPageShell
      event={event}
      user={user}
      unreadCount={unread}
      section="Reports"
      title="Proof of performance."
      subtitle="Headline metrics, predictions vs actuals, and a shareable summary you can hand to stakeholders."
      isInternal={isInternal}
      viewerRole={user.role}
      heroRight={<ExportMenu eventId={id} view="reports" />}
    >
      {isInternal && !report.isPublished && (
        <PublishReportBanner reportId={report.id} />
      )}

      <section className="py-8">
        <DashboardTabs accountId={event.accountId}>
          <div>
            <EditorialEyebrow accent>The headlines</EditorialEyebrow>
            <div className="mt-4 grid grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricCard
                icon={Users}
                label="Total plays"
                value={metrics.totalPlays.toLocaleString()}
              />
              <MetricCard
                icon={Target}
                label="Total leads"
                value={metrics.totalLeads.toLocaleString()}
                delta={
                  metrics.totalPlays > 0
                    ? `${((metrics.totalLeads / metrics.totalPlays) * 100).toFixed(0)}% conversion`
                    : undefined
                }
                positive={true}
              />
              <MetricCard
                icon={Eye}
                label="Interactions"
                value={metrics.totalInteractions.toLocaleString()}
              />
              <MetricCard
                icon={DollarSign}
                label="Cost per lead"
                value={cpl !== null ? `£${(cpl / 100).toFixed(2)}` : "—"}
              />
            </div>
          </div>
        </DashboardTabs>
      </section>

      <Hairline className="opacity-60" />

      <section className="py-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Object.keys(predictionsRecord).length > 0 && (
          <div>
            <EditorialEyebrow>Predicted vs actual</EditorialEyebrow>
            <div className="mt-4">
              <PredictedVsActual
                predictions={predictionsRecord}
                actuals={metricsRecord}
              />
            </div>
          </div>
        )}
        {Object.keys(benchmarkMap).length > 0 && (
          <div>
            <EditorialEyebrow>Vs benchmark</EditorialEyebrow>
            <div className="mt-4">
              <BenchmarkComparison
                eventMetrics={metricsRecord}
                benchmarks={benchmarkMap}
              />
            </div>
          </div>
        )}
      </section>

      {highlights.length > 0 && (
        <>
          <Hairline className="opacity-60" />
          <section className="py-8">
            <EditorialEyebrow>The moments</EditorialEyebrow>
            <div className="mt-4">
              <ReportHighlights highlights={highlights} />
            </div>
          </section>
        </>
      )}

      <Hairline className="opacity-60" />

      <ScheduledExportsSection eventId={id} isInternal={isInternal} />

      <Hairline className="opacity-60" />

      <section className="py-8 grid grid-cols-1 lg:grid-cols-2 gap-4">
        {isInternal && (
          <ShareableReportBanner
            reportId={report.id}
            shareToken={report.shareToken}
            isPublished={report.isPublished}
          />
        )}
        <RebookCTA />
      </section>
    </EventPageShell>
  );
}

async function ScheduledExportsSection({
  eventId,
  isInternal,
}: {
  eventId: string;
  isInternal: boolean;
}) {
  const exports = await getScheduledExports(eventId);

  if (!isInternal && exports.length === 0) return null;

  return (
    <section className="py-8">
      <EditorialEyebrow>Data exports</EditorialEyebrow>
      <p className="text-sm text-muted-foreground mt-1 mb-4">
        Schedule recurring data exports or run one-off downloads.
      </p>
      <ScheduledExportManager eventId={eventId} exports={exports} />
    </section>
  );
}

