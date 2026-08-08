/**
 * All-hands results slide — one landscape page a champion can drop straight
 * into the company all-hands deck: headline number, three supporting stats,
 * the Bright.Blue measurement mark.
 *
 * Lives in the bare (print) route group (no site chrome). Rasterised to a
 * landscape PDF by /api/reports/:token/slide-pdf via the shared Puppeteer
 * pipeline. Public by unguessable share token, same as the report page.
 */
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getEventReportByShareToken } from "@/lib/queries/event-reports";
import { normaliseMetrics } from "@/lib/reports/normalise";
import { pickHeadlineStat } from "@/lib/reports/reveal";
import { formatSatisfactionScore } from "@/lib/reports/normalise";

export const metadata: Metadata = {
  title: "Results slide",
  description: "One-slide event results, ready for the all-hands deck.",
};

interface PageProps {
  params: Promise<{ token: string }>;
}

export default async function ReportSlidePage({ params }: PageProps) {
  const { token } = await params;
  const report = await getEventReportByShareToken(token);
  if (!report || !report.isPublished) notFound();

  const metrics = normaliseMetrics(report.metricsJson);
  const stat = pickHeadlineStat(metrics);
  if (!stat) notFound();

  const eventName = (() => {
    const t = report.title ?? "Event";
    const idx = t.indexOf("—");
    return idx >= 0 ? t.slice(idx + 1).trim() : t.trim();
  })();

  const optInRate =
    metrics.totalPlays > 0 && metrics.totalLeads > 0
      ? `${((metrics.totalLeads / metrics.totalPlays) * 100).toFixed(0)}%`
      : null;
  const satisfaction = formatSatisfactionScore(metrics);

  const supporting: Array<{ value: string; label: string }> = [];
  if (metrics.totalPlays > 0 && stat.label !== "plays") {
    supporting.push({
      value: metrics.totalPlays.toLocaleString("en-GB"),
      label: "Plays",
    });
  }
  if (optInRate) supporting.push({ value: optInRate, label: "Opt-in rate" });
  if (metrics.mediaImpressions > 0 && stat.label !== "footfall impressions") {
    supporting.push({
      value: metrics.mediaImpressions.toLocaleString("en-GB"),
      label: "Footfall impressions",
    });
  }
  if (satisfaction) supporting.push({ value: satisfaction, label: "Satisfaction" });

  return (
    <main className="report-slide theme-light mx-auto flex min-h-screen max-w-5xl flex-col justify-between bg-white px-16 py-14 text-slate-900">
      <header className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--color-bb-cobalt)]">
          Results · {eventName}
        </p>
        <p className="text-sm font-bold">bright.blue</p>
      </header>

      <section className="text-center">
        <p className="text-[9rem] font-bold leading-none tabular-nums">
          {stat.value}
        </p>
        <p className="mt-4 text-3xl font-medium text-[var(--color-bb-cobalt)]">
          {stat.label}
        </p>
        {stat.support && (
          <p className="mt-2 text-lg text-slate-500">{stat.support}</p>
        )}
      </section>

      <section className="grid grid-cols-3 gap-6">
        {supporting.slice(0, 3).map((s) => (
          <div
            key={s.label}
            className="rounded-xl border border-slate-200 px-6 py-5 text-center"
          >
            <p className="text-3xl font-bold tabular-nums">{s.value}</p>
            <p className="mt-1 text-xs uppercase tracking-wider text-slate-500">
              {s.label}
            </p>
          </div>
        ))}
      </section>

      <footer className="flex items-center justify-between text-xs text-slate-400">
        <p>Measured on the machine, not estimated — every play and opt-in logged live.</p>
        <p>Proof of performance · bright.blue</p>
      </footer>
    </main>
  );
}
