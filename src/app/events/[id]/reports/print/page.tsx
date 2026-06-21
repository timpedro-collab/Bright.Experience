/**
 * Print-optimised report page — rendered by Puppeteer for PDF export.
 * White background, no navigation chrome, perfect A4 portrait layout.
 */
import { notFound, redirect } from "next/navigation";
import Image from "next/image";

import { MetricCard } from "@/components/reports/MetricCard";
import { PredictedVsActual } from "@/components/reports/PredictedVsActual";
import { BenchmarkComparison } from "@/components/reports/BenchmarkComparison";
import { ReportHighlights } from "@/components/reports/ReportHighlights";

import { getEventById } from "@/lib/queries/events";
import { getEventReports } from "@/lib/queries/event-reports";
import { getLatestEventMetrics } from "@/lib/queries/event-metrics";
import { getBenchmarkForComparison } from "@/lib/queries/benchmarks";
import { getUser } from "@/lib/auth";
import { isInternalRole } from "@/lib/roles";
import { canViewSection } from "@/lib/event-access";
import {
  costPerLeadPence,
  normaliseHighlights,
  normaliseMetrics,
  normalisePredictions,
} from "@/lib/reports/normalise";
import { Users, Target, Eye, DollarSign } from "lucide-react";

export default async function ReportPrintPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getUser();
  if (!user) redirect("/login");
  const { id } = await params;
  const [event, reports] = await Promise.all([
    getEventById(id),
    getEventReports(id),
  ]);
  if (!event) return notFound();
  const report = reports?.[0];
  if (!report) return notFound();
  // Reports are scoped to the customer + the account/admin/dev roles. Ops,
  // Creative, and QA never see post-event reporting.
  if (!canViewSection(user.role, "reports")) return notFound();
  // Draft (unpublished) reports are internal-only — customers must not be
  // able to reach them via the print route, which the PDF export renders.
  if (!isInternalRole(user.role) && !report.isPublished) return notFound();

  const [latestMetrics, benchmarkList] = await Promise.all([
    getLatestEventMetrics(id),
    getBenchmarkForComparison(event.eventType ?? "experiential"),
  ]);

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
  const predictions = normalisePredictions(report.predictionsJson);
  const highlights = normaliseHighlights(report.highlightsJson);
  const cpl = costPerLeadPence(metrics);

  const metricsRecord: Record<string, number> = {
    interactions: metrics.totalInteractions,
    leads: metrics.totalLeads,
    impressions: metrics.mediaImpressions,
  };
  const predictionsRecord: Record<string, number> = {};
  if (predictions.estimatedInteractions !== null)
    predictionsRecord.interactions = predictions.estimatedInteractions;
  if (predictions.estimatedLeads !== null)
    predictionsRecord.leads = predictions.estimatedLeads;
  if (predictions.estimatedImpressions !== null)
    predictionsRecord.impressions = predictions.estimatedImpressions;

  const benchmarkMap: Record<string, number> = {};
  for (const b of benchmarkList) benchmarkMap[b.metricName] = b.avgValue ?? 0;

  const dateStr = new Date().toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="theme-light bg-white text-[hsl(233,50%,8%)] min-h-screen">
      <style>{`
        @media print {
          @page { size: A4 portrait; margin: 16mm 12mm; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
        .print-break { break-before: page; }
      `}</style>

      {/* Header */}
      <header className="flex items-center justify-between border-b border-gray-200 pb-6 mb-8">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-gray-500 mb-1">
            Proof of Performance
          </p>
          <h1 className="text-2xl font-bold text-gray-900">{event.name}</h1>
          <p className="text-sm text-gray-500 mt-1">
            {event.account.name} &middot; {dateStr}
          </p>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold text-[#3366FF]">bright.blue</p>
          <p className="text-[10px] text-gray-400 mt-1">Confidential</p>
        </div>
      </header>

      {/* KPI Cards */}
      <section className="mb-8">
        <h2 className="text-xs uppercase tracking-[0.2em] text-gray-500 mb-4">
          The headlines
        </h2>
        <div className="grid grid-cols-4 gap-4">
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
            positive
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
      </section>

      {/* Predictions + Benchmarks */}
      <section className="mb-8 grid grid-cols-2 gap-6">
        {Object.keys(predictionsRecord).length > 0 && (
          <div>
            <h2 className="text-xs uppercase tracking-[0.2em] text-gray-500 mb-4">
              Predicted vs actual
            </h2>
            <PredictedVsActual
              predictions={predictionsRecord}
              actuals={metricsRecord}
            />
          </div>
        )}
        {Object.keys(benchmarkMap).length > 0 && (
          <div>
            <h2 className="text-xs uppercase tracking-[0.2em] text-gray-500 mb-4">
              Vs benchmark
            </h2>
            <BenchmarkComparison
              eventMetrics={metricsRecord}
              benchmarks={benchmarkMap}
            />
          </div>
        )}
      </section>

      {/* Highlights */}
      {highlights.length > 0 && (
        <section className="print-break pt-8">
          <h2 className="text-xs uppercase tracking-[0.2em] text-gray-500 mb-4">
            The moments
          </h2>
          <ReportHighlights highlights={highlights} />
        </section>
      )}

      {/* Footer */}
      <footer className="mt-12 pt-4 border-t border-gray-200 flex items-center justify-between text-[10px] text-gray-400">
        <span>
          {event.name} &middot; {event.account.name}
        </span>
        <span>Confidential &middot; bright.blue &middot; {dateStr}</span>
      </footer>
    </div>
  );
}
