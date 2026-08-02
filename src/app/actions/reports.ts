/** Server actions for proof-of-performance reports and benchmarks. */
"use server";

import { requireInternalUser } from "@/lib/auth";
import { canViewCommercial } from "@/lib/roles";
import { getServiceRoleClient } from "@/lib/supabase/service-role";
import { generateEventReportInternal } from "@/server/reports";
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
        // Aggregated across every tier the snapshots came from; the curated
        // tier-specific rows in the seed sit alongside this one.
        location_tier: null,
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
    .upsert(rows, {
      onConflict: "event_type,location_tier,machine_type,game_type,metric_name",
    });

  if (upsertErr) {
    return { success: false as const, error: upsertErr.message };
  }

  revalidatePath("/admin/benchmarks");
  return { success: true as const, data: { updated: rows.length } };
}
