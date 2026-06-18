/** Server actions for proof-of-performance reports and benchmarks. */
"use server";

import { requireInternalUser } from "@/lib/auth";
import { canViewCommercial } from "@/lib/roles";
import { getServiceRoleClient } from "@/lib/supabase/service-role";
import { getPostShowReport } from "@/lib/brightblue/client";
import { revalidatePath } from "next/cache";

/**
 * Generate a post-event report from metrics snapshots and original quote predictions.
 * Fetches the event, its linked quote (if any), and aggregated metrics, then
 * assembles metrics_json, predictions_json, and comparison_json.
 *
 * Reports are created with `is_published = false` so an internal user must
 * review and explicitly publish before the customer sees the data.
 *
 * @returns The new report id on success.
 */
export async function generateEventReport(eventId: string) {
  const { supabase } = await requireInternalUser();
  return generateEventReportInternal(eventId, supabase);
}

/**
 * Service-role variant — used by the reports cron where there is no
 * authenticated user in the request context.
 */
export async function generateEventReportSystem(eventId: string) {
  const supabase = getServiceRoleClient();
  return generateEventReportInternal(eventId, supabase);
}

/** Shared implementation for both authenticated and system-level report generation. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function generateEventReportInternal(eventId: string, supabase: any) {
  const { data: event, error: eventErr } = await supabase
    .from("events")
    .select("id, name, event_type, machine_type, account_id")
    .eq("id", eventId)
    .single();

  if (eventErr || !event) {
    return { success: false as const, error: "Event not found" };
  }

  const { data: snapshots } = await supabase
    .from("event_metrics_snapshot")
    .select("*")
    .eq("event_id", eventId)
    .order("snapshot_date");

  let totalPlays = snapshots?.reduce((s: number, r: Record<string, unknown>) => s + ((r.total_plays as number) ?? 0), 0) ?? 0;
  let totalInteractions = snapshots?.reduce((s: number, r: Record<string, unknown>) => s + ((r.total_interactions as number) ?? 0), 0) ?? 0;
  let totalLeads = snapshots?.reduce((s: number, r: Record<string, unknown>) => s + ((r.total_leads as number) ?? 0), 0) ?? 0;
  let totalPrizes = snapshots?.reduce((s: number, r: Record<string, unknown>) => s + ((r.total_prizes as number) ?? 0), 0) ?? 0;

  const dwellValues = snapshots
    ?.map((r: Record<string, unknown>) => Number(r.avg_dwell_time))
    .filter((v: number) => !Number.isNaN(v) && v > 0) ?? [];
  let avgDwellTime =
    dwellValues.length > 0
      ? dwellValues.reduce((a: number, b: number) => a + b, 0) / dwellValues.length
      : null;

  // Resilience: if the live webhook never delivered metrics, pull the final
  // post-show report straight from Bright.Blue Cloud and persist a snapshot so
  // the report (and benchmarks) aren't empty. No-ops when Cloud isn't configured.
  if (totalPlays + totalInteractions + totalLeads + totalPrizes === 0) {
    const cloud = await getPostShowReport(eventId);
    if (cloud) {
      totalPlays = cloud.total_plays ?? 0;
      totalInteractions = cloud.total_interactions ?? 0;
      totalLeads = cloud.total_leads ?? 0;
      totalPrizes = cloud.total_prizes ?? 0;
      avgDwellTime = cloud.avg_dwell_time ?? avgDwellTime;

      await supabase.from("event_metrics_snapshot").upsert(
        {
          event_id: eventId,
          snapshot_date: new Date().toISOString().slice(0, 10),
          total_plays: totalPlays,
          total_interactions: totalInteractions,
          total_leads: totalLeads,
          total_prizes: totalPrizes,
          avg_dwell_time: avgDwellTime ?? 0,
          is_final: true,
        },
        { onConflict: "event_id,snapshot_date" },
      );
    }
  }

  const metricsJson: Record<string, unknown> = {
    totalPlays,
    totalInteractions,
    totalLeads,
    totalPrizes,
    avgDwellTime,
    snapshotCount: snapshots?.length ?? 0,
  };

  let predictionsJson: Record<string, unknown> = {};
  let comparisonJson: Record<string, unknown> = {};

  const { data: quote } = await supabase
    .from("quotes")
    .select("outcome_estimates_json, estimated_interactions, estimated_leads, estimated_impressions")
    .eq("event_id", eventId)
    .limit(1)
    .maybeSingle();

  if (quote) {
    const estimates = (quote.outcome_estimates_json ?? {}) as Record<string, unknown>;
    const estInteractions = (quote.estimated_interactions ?? estimates.interactions ?? null) as number | null;
    const estLeads = (quote.estimated_leads ?? estimates.leads ?? null) as number | null;

    predictionsJson = {
      estimatedInteractions: estInteractions,
      estimatedLeads: estLeads,
      estimatedImpressions: quote.estimated_impressions ?? estimates.impressions ?? null,
      raw: estimates,
    };

    comparisonJson = {
      interactions: {
        predicted: estInteractions,
        actual: totalInteractions,
        delta: estInteractions != null ? totalInteractions - estInteractions : null,
      },
      leads: {
        predicted: estLeads,
        actual: totalLeads,
        delta: estLeads != null ? totalLeads - estLeads : null,
      },
    };
  }

  const { data: report, error: insertErr } = await supabase
    .from("event_reports")
    .insert({
      event_id: eventId,
      report_type: "post_event",
      title: `Post-Event Report — ${event.name}`,
      metrics_json: metricsJson,
      predictions_json: predictionsJson,
      comparison_json: comparisonJson,
      highlights_json: [],
      is_published: false,
    })
    .select("id")
    .single();

  if (insertErr || !report) {
    return { success: false as const, error: "Failed to generate report" };
  }

  revalidatePath(`/events/${eventId}/reports`);
  revalidatePath("/admin/reports");
  return { success: true as const, data: { id: report.id } };
}

/** Publish a report: makes it publicly accessible via a generated share token. */
export async function publishReport(reportId: string) {
  const { supabase } = await requireInternalUser();

  const shareToken = crypto.randomUUID();

  const { data: report, error } = await supabase
    .from("event_reports")
    .update({
      is_published: true,
      share_token: shareToken,
      published_at: new Date().toISOString(),
    })
    .eq("id", reportId)
    .select("event_id")
    .single();

  if (error) {
    return { success: false as const, error: "Failed to publish report" };
  }

  revalidatePath("/admin/reports");
  if (report?.event_id) revalidatePath(`/events/${report.event_id}/reports`);
  revalidatePath(`/report/${shareToken}`);
  return { success: true as const, data: { shareToken } };
}

/** Unpublish a report: removes public access. */
export async function unpublishReport(reportId: string) {
  const { supabase } = await requireInternalUser();

  const { data: report, error } = await supabase
    .from("event_reports")
    .update({ is_published: false })
    .eq("id", reportId)
    .select("event_id, share_token")
    .single();

  if (error) {
    return { success: false as const, error: "Failed to unpublish report" };
  }

  revalidatePath("/admin/reports");
  if (report?.event_id) revalidatePath(`/events/${report.event_id}/reports`);
  if (report?.share_token) revalidatePath(`/report/${report.share_token}`);
  return { success: true as const, data: { id: reportId } };
}

/**
 * Recalculate aggregate benchmarks from completed event data.
 *
 * Groups completed events by event_type / machine_type, computes avg and
 * median for core metrics, then upserts into the benchmarks table.
 */
export async function updateBenchmarks() {
  const { profile } = await requireInternalUser();
  if (!canViewCommercial(profile.role)) {
    return { success: false as const, error: "Only commercial staff can update benchmarks" };
  }
  const supabase = getServiceRoleClient();

  const { data: events, error: evtErr } = await supabase
    .from("events")
    .select("id, event_type, machine_type")
    .eq("current_stage", "complete");

  if (evtErr || !events?.length) {
    return { success: false as const, error: evtErr?.message ?? "No completed events" };
  }

  const eventIds = events.map((e: Record<string, unknown>) => e.id as string);
  const { data: snapshots } = await supabase
    .from("event_metrics_snapshot")
    .select("event_id, total_plays, total_leads, total_interactions, avg_dwell_time")
    .in("event_id", eventIds);

  if (!snapshots?.length) {
    return { success: false as const, error: "No metrics snapshots found" };
  }

  type MetricRow = Record<string, unknown>;
  const eventLookup = new Map<string, MetricRow>(
    events.map((e: MetricRow) => [e.id as string, e]),
  );

  type Aggregated = { plays: number; leads: number; interactions: number; dwell: number };
  const groups = new Map<string, Aggregated[]>();

  for (const snap of snapshots as MetricRow[]) {
    const evt = eventLookup.get(snap.event_id as string);
    if (!evt) continue;
    const key = `${evt.event_type ?? "unknown"}::${evt.machine_type ?? ""}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push({
      plays: Number(snap.total_plays ?? 0),
      leads: Number(snap.total_leads ?? 0),
      interactions: Number(snap.total_interactions ?? 0),
      dwell: Number(snap.avg_dwell_time ?? 0),
    });
  }

  const median = (vals: number[]) => {
    const sorted = [...vals].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  };

  const rows: Record<string, unknown>[] = [];
  for (const [key, items] of groups) {
    const [eventType, machineType] = key.split("::");
    const metrics: [string, (r: Aggregated) => number][] = [
      ["total_plays", (r) => r.plays],
      ["total_leads", (r) => r.leads],
      ["total_interactions", (r) => r.interactions],
      ["avg_dwell_time", (r) => r.dwell],
    ];
    for (const [metricName, accessor] of metrics) {
      const vals = items.map(accessor).filter((v) => v > 0);
      if (!vals.length) continue;
      const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
      rows.push({
        event_type: eventType,
        machine_type: machineType || null,
        game_type: null,
        metric_name: metricName,
        avg_value: Math.round(avg * 100) / 100,
        median_value: Math.round(median(vals) * 100) / 100,
        sample_size: vals.length,
        updated_at: new Date().toISOString(),
      });
    }
  }

  const { error: upsertErr } = await supabase
    .from("benchmarks")
    .upsert(rows, { onConflict: "event_type,machine_type,game_type,metric_name" });

  if (upsertErr) {
    return { success: false as const, error: upsertErr.message };
  }

  revalidatePath("/admin/benchmarks");
  return { success: true as const, data: { updated: rows.length } };
}
