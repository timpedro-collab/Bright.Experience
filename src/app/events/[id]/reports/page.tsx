/** Proof of Performance page — post-event reporting with metrics, benchmarks, and sharing */
import { notFound, redirect } from "next/navigation";
import { BarChart3, Users, Target, Eye, DollarSign, FileText } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { EventContextBar } from "@/components/events/EventContextBar";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/button";
import { MetricCard } from "@/components/reports/MetricCard";
import { getUnreadCount } from "@/lib/queries/notifications";
import { PredictedVsActual } from "@/components/reports/PredictedVsActual";
import { BenchmarkComparison } from "@/components/reports/BenchmarkComparison";
import { ReportHighlights } from "@/components/reports/ReportHighlights";
import { ShareableReportBanner } from "@/components/reports/ShareableReportBanner";
import { RebookCTA } from "@/components/reports/RebookCTA";
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
      <AppShell
        eventId={id}
        user={user}
        isInternal={isInternal}
        notificationCount={unread}
      >
        <EventContextBar event={event} currentSection="Reports" />
        <PageHeader
          eyebrow="Proof of performance"
          title="Reports"
          subtitle="Post-event reporting, ROI insights, and shareable summaries."
        />
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
      </AppShell>
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
  const highlights = (report.highlightsJson ?? []) as Array<{ url: string; caption?: string; stat?: string }>;

  const benchmarkMap: Record<string, number> = {};
  for (const b of benchmarkList) {
    benchmarkMap[b.metricName] = b.avgValue ?? 0;
  }

  return (
    <AppShell
      eventId={id}
      user={user}
      isInternal={isInternal}
      notificationCount={unread}
    >
      <EventContextBar event={event} currentSection="Reports" />
      <PageHeader
        eyebrow="Proof of performance"
        title="Reports"
        subtitle="Headline metrics, predictions vs actuals, and a shareable summary you can hand to stakeholders."
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard icon={Users} label="Total plays" value={totalPlays.toLocaleString()} />
        <MetricCard
          icon={Target}
          label="Total leads"
          value={totalLeads.toLocaleString()}
          delta={totalPlays > 0 ? `${((totalLeads / totalPlays) * 100).toFixed(0)}% conversion` : undefined}
          positive={true}
        />
        <MetricCard icon={Eye} label="Interactions" value={Number(latestMetrics?.total_interactions ?? 0).toLocaleString()} />
        <MetricCard
          icon={DollarSign}
          label="Cost per lead"
          value={totalLeads > 0 ? `£${(Number(metricsData.total_cost ?? 0) / totalLeads).toFixed(2)}` : "—"}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        {Object.keys(predictionsData).length > 0 && (
          <PredictedVsActual predictions={predictionsData} actuals={metricsData} />
        )}
        {Object.keys(benchmarkMap).length > 0 && (
          <BenchmarkComparison eventMetrics={metricsData} benchmarks={benchmarkMap} />
        )}
      </div>

      {highlights.length > 0 && (
        <div className="mb-6">
          <ReportHighlights highlights={highlights} />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ShareableReportBanner
          reportId={report.id}
          shareToken={report.shareToken}
          isPublished={report.isPublished}
        />
        <RebookCTA />
      </div>
    </AppShell>
  );
}

function GenerateReportButton({ eventId }: { eventId: string }) {
  return (
    <form
      action={async () => {
        "use server";
        await generateEventReport(eventId);
      }}
      className="flex justify-center pb-8"
    >
      <Button type="submit">
        <FileText size={14} className="mr-2" /> Generate Report
      </Button>
    </form>
  );
}
