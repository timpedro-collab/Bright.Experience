/** Public shareable report page — viewable without auth via share token */
import { notFound } from "next/navigation";
import Link from "next/link";
import { Users, Target, Eye, DollarSign } from "lucide-react";
import { getEventReportByShareToken } from "@/lib/queries/event-reports";
import { MetricCard } from "@/components/reports/MetricCard";
import { PredictedVsActual } from "@/components/reports/PredictedVsActual";
import { ReportHighlights } from "@/components/reports/ReportHighlights";

export default async function PublicReportPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const report = await getEventReportByShareToken(token);

  if (!report || !report.isPublished) return notFound();

  const metrics = (report.metricsJson ?? {}) as Record<string, number>;
  const predictions = (report.predictionsJson ?? {}) as Record<string, number>;
  const highlights = (report.highlightsJson ?? []) as Array<{ url: string; caption?: string; stat?: string }>;

  const totalPlays = metrics.total_plays ?? 0;
  const totalLeads = metrics.total_leads ?? 0;
  const mediaImpressions = metrics.media_impressions ?? 0;
  const totalCost = metrics.total_cost ?? 0;

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-5xl px-6 py-12">
        <div className="flex items-center gap-3 mb-10">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand text-white font-bold text-sm">
              B
            </div>
            <span className="text-heading text-sm font-semibold text-foreground">
              Bright.Experience
            </span>
          </Link>
          <span className="text-xs text-muted-foreground ml-auto">Proof of Performance</span>
        </div>

        <div className="mb-8">
          <h1 className="text-heading text-2xl font-bold text-foreground mb-1">
            {report.title ?? "Event Report"}
          </h1>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <MetricCard icon={Users} label="Total Plays" value={totalPlays.toLocaleString()} />
          <MetricCard
            icon={Target}
            label="Total Leads"
            value={totalLeads.toLocaleString()}
            delta={totalPlays > 0 ? `${((totalLeads / totalPlays) * 100).toFixed(0)}% conversion` : undefined}
            positive={true}
          />
          <MetricCard icon={Eye} label="Media Impressions" value={mediaImpressions.toLocaleString()} />
          <MetricCard
            icon={DollarSign}
            label="Cost Per Lead"
            value={totalLeads > 0 ? `£${(totalCost / totalLeads).toFixed(2)}` : "—"}
          />
        </div>

        {Object.keys(predictions).length > 0 && (
          <div className="mb-8">
            <PredictedVsActual predictions={predictions} actuals={metrics} />
          </div>
        )}

        {highlights.length > 0 && (
          <div className="mb-8">
            <ReportHighlights highlights={highlights} />
          </div>
        )}

        <footer className="mt-12 pt-6 border-t border-glass-border/10 text-center">
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} Bright.Blue Events. All rights reserved.
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Powered by{" "}
            <Link href="/catalog" className="text-brand hover:underline">Bright.Experience</Link>
          </p>
        </footer>
      </div>
    </div>
  );
}
