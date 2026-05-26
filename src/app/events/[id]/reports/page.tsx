/** Proof of Performance — post-event reporting with metrics, benchmarks, and sharing. */
import { notFound, redirect } from "next/navigation";
import {
  BarChart3,
  Users,
  Target,
  Eye,
  DollarSign,
  FileText,
} from "lucide-react";

import { EventPageShell, EditorialEyebrow, Hairline } from "@/components/brand";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/button";
import { MetricCard } from "@/components/reports/MetricCard";
import { PredictedVsActual } from "@/components/reports/PredictedVsActual";
import { BenchmarkComparison } from "@/components/reports/BenchmarkComparison";
import { ReportHighlights } from "@/components/reports/ReportHighlights";
import { ShareableReportBanner } from "@/components/reports/ShareableReportBanner";
import { RebookCTA } from "@/components/reports/RebookCTA";

import { getUnreadCount } from "@/lib/queries/notifications";
import { getEventById } from "@/lib/queries/events";
import { getEventReports } from "@/lib/queries/event-reports";
import { getLatestEventMetrics } from "@/lib/queries/event-metrics";
import { getBenchmarkForComparison } from "@/lib/queries/benchmarks";
import { generateEventReport } from "@/app/actions/reports";
import { getUser } from "@/lib/auth";
import { isInternalRole } from "@/lib/roles";

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
    return (
      <EventPageShell
        event={event}
        user={user}
        unreadCount={unread}
        section="Reports"
        title="Proof of performance."
        subtitle="Post-event reporting, ROI insights, and shareable summaries."
      >
        <section className="py-8">
          <EmptyState
            icon={BarChart3}
            title="No report generated yet"
            description={
              isInternal
                ? "Generate a proof-of-performance report once post-event data has been collected."
                : "Your proof-of-performance report is being prepared. Check back soon."
            }
          />
          {isInternal && <GenerateReportButton eventId={id} />}
        </section>
      </EventPageShell>
    );
  }

  const [latestMetrics, benchmarkList] = await Promise.all([
    getLatestEventMetrics(id),
    getBenchmarkForComparison(event.eventType ?? "experiential"),
  ]);

  const totalPlays = Number(latestMetrics?.total_plays ?? 0);
  const totalLeads = Number(latestMetrics?.total_leads ?? 0);

  const metricsData = (report.metricsJson ?? {}) as Record<string, number>;
  const predictionsData = (report.predictionsJson ?? {}) as Record<string, number>;
  const highlights = (report.highlightsJson ?? []) as Array<{
    url: string;
    caption?: string;
    stat?: string;
  }>;

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
    >
      <section className="py-8">
        <EditorialEyebrow accent>The headlines</EditorialEyebrow>
        <div className="mt-4 grid grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            icon={Users}
            label="Total plays"
            value={totalPlays.toLocaleString()}
          />
          <MetricCard
            icon={Target}
            label="Total leads"
            value={totalLeads.toLocaleString()}
            delta={
              totalPlays > 0
                ? `${((totalLeads / totalPlays) * 100).toFixed(0)}% conversion`
                : undefined
            }
            positive={true}
          />
          <MetricCard
            icon={Eye}
            label="Interactions"
            value={Number(latestMetrics?.total_interactions ?? 0).toLocaleString()}
          />
          <MetricCard
            icon={DollarSign}
            label="Cost per lead"
            value={
              totalLeads > 0
                ? `£${(Number(metricsData.total_cost ?? 0) / totalLeads).toFixed(2)}`
                : "—"
            }
          />
        </div>
      </section>

      <Hairline className="opacity-60" />

      <section className="py-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Object.keys(predictionsData).length > 0 && (
          <div>
            <EditorialEyebrow>Predicted vs actual</EditorialEyebrow>
            <div className="mt-4">
              <PredictedVsActual
                predictions={predictionsData}
                actuals={metricsData}
              />
            </div>
          </div>
        )}
        {Object.keys(benchmarkMap).length > 0 && (
          <div>
            <EditorialEyebrow>Vs benchmark</EditorialEyebrow>
            <div className="mt-4">
              <BenchmarkComparison
                eventMetrics={metricsData}
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

      <section className="py-8 grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ShareableReportBanner
          reportId={report.id}
          shareToken={report.shareToken}
          isPublished={report.isPublished}
        />
        <RebookCTA />
      </section>
    </EventPageShell>
  );
}

function GenerateReportButton({ eventId }: { eventId: string }) {
  return (
    <form
      action={async () => {
        "use server";
        await generateEventReport(eventId);
      }}
      className="flex justify-center pt-4"
    >
      <Button type="submit">
        <FileText size={14} className="mr-2" /> Generate report
      </Button>
    </form>
  );
}
