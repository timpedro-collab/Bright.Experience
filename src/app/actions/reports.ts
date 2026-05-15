/** Server actions for proof-of-performance reports and benchmarks. */
"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

/**
 * Generate a post-event report from metrics snapshots and original quote predictions.
 * Fetches the event, its linked quote (if any), and aggregated metrics, then
 * assembles metrics_json, predictions_json, and comparison_json.
 * @returns The new report id on success.
 */
export async function generateEventReport(eventId: string) {
  const supabase = await createClient();

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

  const totalPlays = snapshots?.reduce((s, r) => s + (r.total_plays ?? 0), 0) ?? 0;
  const totalInteractions = snapshots?.reduce((s, r) => s + (r.total_interactions ?? 0), 0) ?? 0;
  const totalLeads = snapshots?.reduce((s, r) => s + (r.total_leads ?? 0), 0) ?? 0;
  const totalPrizes = snapshots?.reduce((s, r) => s + (r.total_prizes ?? 0), 0) ?? 0;

  const dwellValues = snapshots
    ?.map((r) => Number(r.avg_dwell_time))
    .filter((v) => !Number.isNaN(v) && v > 0) ?? [];
  const avgDwellTime =
    dwellValues.length > 0
      ? dwellValues.reduce((a, b) => a + b, 0) / dwellValues.length
      : null;

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
  const supabase = await createClient();

  const shareToken = crypto.randomUUID();

  const { error } = await supabase
    .from("event_reports")
    .update({
      is_published: true,
      share_token: shareToken,
      published_at: new Date().toISOString(),
    })
    .eq("id", reportId);

  if (error) {
    return { success: false as const, error: "Failed to publish report" };
  }

  revalidatePath("/admin/reports");
  return { success: true as const, data: { shareToken } };
}

/** Unpublish a report: removes public access. */
export async function unpublishReport(reportId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("event_reports")
    .update({ is_published: false })
    .eq("id", reportId);

  if (error) {
    return { success: false as const, error: "Failed to unpublish report" };
  }

  revalidatePath("/admin/reports");
  return { success: true as const, data: { id: reportId } };
}

/** Placeholder: recalculate aggregate benchmarks from completed event data. */
export async function updateBenchmarks() {
  // Future implementation: aggregate metrics across completed events,
  // grouped by event_type / machine_type / metric_name, and upsert
  // into the benchmarks table with percentile calculations.
  return { success: true as const, data: { message: "Benchmark update not yet implemented" } };
}
