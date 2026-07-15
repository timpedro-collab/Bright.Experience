/**
 * Print-optimised live dashboard — snapshot of current metrics for PDF export.
 * White background, no navigation chrome, A4 landscape layout.
 */
import { notFound, redirect } from "next/navigation";

import { HourlyChart } from "@/components/telemetry/HourlyChart";
import { hourlyCurveFromTotal } from "@/lib/metrics/drivers";
import { getEventById } from "@/lib/queries/events";
import { getLatestEventMetrics } from "@/lib/queries/event-metrics";
import { getMachineInstanceSummariesByEvent } from "@/lib/queries/machine-instances";
import { getTelemetryInRange } from "@/lib/queries/telemetry";
import { getUser } from "@/lib/auth";
import { canViewSection } from "@/lib/event-access";
import { Activity, Users, Gift, Clock } from "lucide-react";

export default async function LivePrintPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getUser();
  if (!user) redirect("/login");
  const { id } = await params;
  const event = await getEventById(id);
  if (!event) return notFound();
  // Live telemetry is gated to roles that own event-day operations. Ops and
  // Creative leads are blocked from /live — mirror that on the print route so
  // the PDF export can't leak live KPIs.
  if (!canViewSection(user.role, "live")) return notFound();

  const today = new Date().toISOString().slice(0, 10);
  const startOfDay = `${today}T00:00:00.000Z`;
  const endOfDay = `${today}T23:59:59.999Z`;

  const [metrics, machines, rawHourly] = await Promise.all([
    getLatestEventMetrics(id),
    getMachineInstanceSummariesByEvent(id),
    getTelemetryInRange(id, startOfDay, endOfDay),
  ]);

  const hourlyMap: Record<number, { plays: number; leads: number }> = {};
  for (let h = 8; h <= 20; h++) hourlyMap[h] = { plays: 0, leads: 0 };
  for (const row of rawHourly) {
    const hour = new Date(String(row.timestamp)).getHours();
    if (hour < 8 || hour > 20) continue;
    const type = String(row.event_type);
    if (type.includes("play")) hourlyMap[hour].plays++;
    if (type === "lead_captured" || type === "lead") hourlyMap[hour].leads++;
  }
  let hourly = Object.entries(hourlyMap).map(([h, v]) => ({
    hour: Number(h),
    ...v,
  }));

  // Fall back to a snapshot-derived curve when no same-day raw telemetry exists
  // (completed events), so the printed report still shows a time-of-day chart.
  const hasHourlyData = hourly.some((h) => h.plays > 0 || h.leads > 0);
  if (!hasHourlyData && metrics && Number(metrics.total_plays) > 0) {
    hourly = hourlyCurveFromTotal(
      Number(metrics.total_plays),
      Number(metrics.peak_hour ?? 14),
    );
  }

  const dateStr = new Date().toLocaleDateString("en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const timeStr = new Date().toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const kpis = [
    { icon: Activity, label: "Total plays", value: metrics?.total_plays ?? 0 },
    { icon: Users, label: "Total leads", value: metrics?.total_leads ?? 0 },
    { icon: Gift, label: "Prizes won", value: metrics?.total_prizes ?? 0 },
    { icon: Clock, label: "Avg dwell (s)", value: metrics?.avg_dwell_time ?? 0 },
  ];

  return (
    <div className="theme-light bg-white text-[hsl(233,50%,8%)] min-h-screen p-8">
      <style>{`
        @media print {
          @page { size: A4 landscape; margin: 12mm; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>

      <header className="flex items-center justify-between border-b border-gray-200 pb-4 mb-6">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-gray-500 mb-1">
            Live Dashboard Snapshot
          </p>
          <h1 className="text-xl font-bold text-gray-900">{event.name}</h1>
          <p className="text-sm text-gray-500 mt-1">
            {event.account.name} &middot; {dateStr} at {timeStr}
          </p>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold text-[#3366FF]">bright.blue</p>
          <p className="text-[10px] text-gray-400 mt-1">Confidential</p>
        </div>
      </header>

      <section className="grid grid-cols-4 gap-4 mb-6">
        {kpis.map((kpi) => (
          <div
            key={kpi.label}
            className="rounded-lg border border-gray-200 p-4"
          >
            <div className="flex items-center gap-2 mb-2">
              <kpi.icon size={16} className="text-gray-400" />
              <span className="text-xs uppercase tracking-wider text-gray-500">
                {kpi.label}
              </span>
            </div>
            <p className="text-2xl font-bold text-gray-900 tabular-nums">
              {typeof kpi.value === "number"
                ? kpi.value.toLocaleString("en-US")
                : kpi.value}
            </p>
          </div>
        ))}
      </section>

      <section className="mb-6">
        <h2 className="text-xs uppercase tracking-[0.2em] text-gray-500 mb-3">
          Activity by hour
        </h2>
        <HourlyChart data={hourly} />
      </section>

      {machines.length > 0 && (
        <section className="mb-6">
          <h2 className="text-xs uppercase tracking-[0.2em] text-gray-500 mb-3">
            Machine status
          </h2>
          <div className="grid grid-cols-3 gap-3">
            {machines.map((m) => (
              <div
                key={m.serial_number}
                className="rounded-lg border border-gray-200 p-3"
              >
                <p className="font-medium text-sm text-gray-900">
                  {m.nickname ?? m.serial_number}
                </p>
                <p className="text-xs text-gray-500 capitalize mt-1">
                  {m.status}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      <footer className="mt-8 pt-3 border-t border-gray-200 flex items-center justify-between text-[10px] text-gray-400">
        <span>
          {event.name} &middot; {event.account.name}
        </span>
        <span>
          Snapshot at {timeStr} &middot; bright.blue &middot; {dateStr}
        </span>
      </footer>
    </div>
  );
}
