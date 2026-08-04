/** Proof of Performance — post-event reporting with metrics, benchmarks, and sharing. */
import { notFound, redirect } from "next/navigation";
import {
  BarChart3,
  Users,
  Target,
  Eye,
  Star,
} from "lucide-react";

import { EventPageShell } from "@/components/brand/event-page-shell";
import { EditorialEyebrow, Hairline } from "@/components/brand";
import { EmptyState } from "@/components/ui/EmptyState";
import { MetricCard } from "@/components/reports/MetricCard";
import { CaptureQualityCard } from "@/components/reports/CaptureQualityCard";
import { SponsorProofTable } from "@/components/reports/SponsorProofTable";
import {
  SurveySentimentCard,
  AudienceDemographicsCard,
  DigitalFollowThroughCard,
} from "@/components/reports/EngagementReport";
import { ReportHighlights } from "@/components/reports/ReportHighlights";
import { ExecutiveSummary } from "@/components/reports/ExecutiveSummary";
import { BenchmarkContextCard } from "@/components/reports/BenchmarkContext";
import { LeadQualityCard } from "@/components/leads/LeadQualityCard";
import { JourneyFunnelCard } from "@/components/journeys/JourneyFunnelCard";
import { JourneyConfigCard } from "@/components/journeys/JourneyConfigCard";
import { ShareableReportBanner } from "@/components/reports/ShareableReportBanner";
import { RebookCTA } from "@/components/reports/RebookCTA";
import { DashboardTabs } from "@/components/reports/DashboardTabs";
import { ExportMenu } from "@/components/ui/ExportMenu";

import { getUnreadCount } from "@/lib/queries/notifications";
import { getEventById } from "@/lib/queries/events";
import { getRebookSlugsForEvent } from "@/lib/queries/rebook";
import { getEventReports } from "@/lib/queries/event-reports";
import { getLatestEventMetrics } from "@/lib/queries/event-metrics";
import { getJourneyForEvent, getJourneyFunnel } from "@/lib/queries/journeys";
import { getBenchmarkContext } from "@/lib/queries/benchmark-context";
import { getLeadQualitySummary } from "@/lib/queries/lead-quality";
import { GenerateReportButton, PublishReportBanner } from "@/components/reports/ReportActions";
import { RetentionNotice } from "@/components/reports/RetentionNotice";
import { ScheduledExportManager } from "@/components/reports/ScheduledExportManager";
import { getScheduledExports } from "@/app/actions/scheduled-exports";
import { getGameConfiguration } from "@/app/actions/game-config";
import { getUser } from "@/lib/auth";
import { isInternalRole } from "@/lib/roles";
import { canViewSection } from "@/lib/event-access";
import {
  costPerLeadPence,
  normaliseHighlights,
  normaliseMetrics,
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
  if (!canViewSection(user.role, "reports")) redirect(`/events/${id}`);
  const [event, reports, unread] = await Promise.all([
    getEventById(id),
    getEventReports(id),
    getUnreadCount(user.id),
  ]);
  const isInternal = isInternalRole(user.role);
  if (!event) return notFound();

  const rebookSlugs = await getRebookSlugsForEvent(id, event.machineType);

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
            description="Your report is being finalised by the team. You'll be notified as soon as it's ready to view."
          />
        </section>
      </EventPageShell>
    );
  }

  const [latestMetrics, gameConfig, journey, benchmarkContext, leadQuality] =
    await Promise.all([
      getLatestEventMetrics(id),
      getGameConfiguration(id),
      getJourneyForEvent(id),
      getBenchmarkContext(id),
      getLeadQualitySummary(id),
    ]);
  const journeyFunnel = journey ? await getJourneyFunnel(journey.id) : null;

  // The executive tier leads with the venue-class verdicts (the market
  // context), falling back to last-event comparisons for repeat customers.
  const verdictSentences = (
    benchmarkContext.venueClass?.verdicts ??
    benchmarkContext.lastEvent?.verdicts ??
    []
  ).map((v) => `${v.label}: ${v.sentence}`);

  // Use the higher of the live snapshot vs the report blob for each metric.
  // The latest daily snapshot is only the final day's reading, whereas the
  // report blob holds the cumulative event total — taking the max keeps an
  // in-flight event fresh while never under-reporting a completed one's totals.
  const liveMetrics = normaliseMetrics(latestMetrics ?? {});
  const reportMetrics = normaliseMetrics(report.metricsJson);
  const metrics = {
    ...reportMetrics,
    totalPlays: Math.max(liveMetrics.totalPlays, reportMetrics.totalPlays),
    totalLeads: Math.max(liveMetrics.totalLeads, reportMetrics.totalLeads),
    totalInteractions: Math.max(
      liveMetrics.totalInteractions,
      reportMetrics.totalInteractions
    ),
    mediaImpressions: Math.max(
      liveMetrics.mediaImpressions,
      reportMetrics.mediaImpressions
    ),
  };
  const highlights = normaliseHighlights(report.highlightsJson);

  return (
    <EventPageShell
      event={event}
      user={user}
      unreadCount={unread}
      section="Reports"
      title="Proof of performance."
      subtitle="Board-ready proof within 24 hours of wrap — headline metrics, a shareable link, and exports you can hand to stakeholders."
      isInternal={isInternal}
      viewerRole={user.role}
      heroRight={<ExportMenu eventId={id} view="reports" />}
    >
      {!isInternal && report.isPublished && (
        <p className="mb-2 text-sm text-muted-foreground">
          Share the public link or export PDF/CSV/Excel — this is the artefact that renews the next buy.
        </p>
      )}
      {isInternal && !report.isPublished && (
        <PublishReportBanner reportId={report.id} />
      )}

      {/* Tier 1 — the executive story: what it cost per unit of attention. */}
      <section className="pt-8 pb-2">
        <EditorialEyebrow accent>The executive summary</EditorialEyebrow>
        <div className="mt-4">
          <ExecutiveSummary
            totalPlays={metrics.totalPlays}
            totalLeads={metrics.totalLeads}
            avgDwellSeconds={metrics.avgDwellSeconds}
            totalCostPence={metrics.totalCostPence}
            costPerLeadPence={costPerLeadPence(metrics)}
            verdictSentences={verdictSentences}
          />
        </div>
        <div className="mt-4">
          <BenchmarkContextCard context={benchmarkContext} />
        </div>
      </section>

      {/* Tier 2 — KPI detail for the marketing team. */}
      <section className="py-8">
        <DashboardTabs accountId={event.accountId}>
          <div>
            <EditorialEyebrow accent>The headlines</EditorialEyebrow>
            <div className="mt-4 grid grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricCard
                icon={Users}
                label="Total plays"
                value={metrics.totalPlays.toLocaleString("en-US")}
              />
              <MetricCard
                icon={Target}
                label="Leads"
                value={metrics.totalLeads.toLocaleString("en-US")}
                delta={
                  metrics.totalPlays > 0
                    ? `${((metrics.totalLeads / metrics.totalPlays) * 100).toFixed(0)}% opt-in`
                    : undefined
                }
                positive={true}
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
          </div>
        </DashboardTabs>
      </section>

      {(metrics.survey.length > 0 || metrics.npsScore != null) && (
        <>
          <Hairline className="opacity-60" />
          <section className="py-8">
            <EditorialEyebrow accent>Audience &amp; sentiment</EditorialEyebrow>
            <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-6">
              <SurveySentimentCard
                survey={metrics.survey}
                npsScore={metrics.npsScore}
              />
              <AudienceDemographicsCard demographics={metrics.demographics} />
            </div>
            <div className="mt-6">
              <DigitalFollowThroughCard
                socialShares={metrics.socialShares}
                qrScans={metrics.qrScans}
                totalSamples={metrics.totalSamples}
              />
            </div>
          </section>
        </>
      )}

      {journey && journeyFunnel && journeyFunnel.sent > 0 && (
        <>
          <Hairline className="opacity-60" />
          <section className="py-8">
            <EditorialEyebrow accent>The story after the play</EditorialEyebrow>
            <div className="mt-4 max-w-xl">
              <JourneyFunnelCard journey={journey} funnel={journeyFunnel} />
            </div>
          </section>
        </>
      )}

      {/* Tier 3 — ops learnings: data quality and delivery mechanics. */}
      {(metrics.captureQuality || leadQuality.total > 0) && (
        <>
          <Hairline className="opacity-60" />
          <section className="py-8">
            <EditorialEyebrow>Data quality</EditorialEyebrow>
            <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-6">
              {leadQuality.total > 0 && <LeadQualityCard summary={leadQuality} />}
              {metrics.captureQuality && (
                <CaptureQualityCard counts={metrics.captureQuality} />
              )}
            </div>
          </section>
        </>
      )}

      {metrics.sponsors.length > 0 && (
        <>
          <Hairline className="opacity-60" />
          <section className="py-8">
            <EditorialEyebrow>Sponsor performance</EditorialEyebrow>
            <div className="mt-4">
              <SponsorProofTable sponsors={metrics.sponsors} />
            </div>
          </section>
        </>
      )}

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

      {isInternal && (
        <>
          <Hairline className="opacity-60" />
          <section className="py-8">
            <EditorialEyebrow>Post-play journey</EditorialEyebrow>
            <div className="mt-4 max-w-2xl">
              <JourneyConfigCard eventId={id} journey={journey} />
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
        {(isInternal || report.isPublished) && (
          <RebookCTA
            eventType={event.eventType}
            machineSlug={rebookSlugs.machineSlug}
            gameSlug={rebookSlugs.gameSlug}
          />
        )}
      </section>

      <footer className="pb-8 pt-2 border-t border-border/40">
        <RetentionNotice retentionDays={gameConfig?.retentionDays} />
      </footer>
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

