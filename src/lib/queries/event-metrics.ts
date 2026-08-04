/** Supabase read queries for aggregated event metrics snapshots. */
import { createClient } from "@/lib/supabase/server";
import { logQueryError } from "@/lib/observability/log-query-error";
/** Fetch the most recent daily metrics snapshot for an event. */
export async function getLatestEventMetrics(eventId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("event_metrics_snapshot")
    .select(
      "id, event_id, snapshot_date, total_plays, total_interactions, total_leads, total_prizes, avg_dwell_time, peak_hour, stock_remaining, stock_capacity, custom_json, created_at, updated_at"
    )
    .eq("event_id", eventId)
    .order("snapshot_date", { ascending: false })
    .limit(1)
    // maybeSingle, not single: an event with no snapshot yet is the normal
    // pre-show state, and `single()` turns that into a PGRST116 error.
    .maybeSingle();

  if (error || !data) {
    logQueryError("getLatestEventMetrics", error, { eventId });
    return null;
  }
  return data;
}

export interface EventMetricsSummary {
  totalPlays: number;
  totalLeads: number;
}

/**
 * Latest snapshot totals for a set of events, keyed by event id — the
 * side-by-side comparison read for campaign dashboards. Events with no
 * snapshot are simply absent from the map.
 */
export async function getLatestMetricsForEvents(
  eventIds: string[],
): Promise<Map<string, EventMetricsSummary>> {
  const summaries = new Map<string, EventMetricsSummary>();
  if (eventIds.length === 0) return summaries;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("event_metrics_snapshot")
    .select("event_id, snapshot_date, total_plays, total_leads")
    .in("event_id", eventIds)
    .order("snapshot_date", { ascending: false })
    .limit(1000);

  if (error) {
    logQueryError("getLatestMetricsForEvents", error, {
      eventCount: eventIds.length,
    });
    return summaries;
  }

  // Rows are newest-first; keep the first (latest, cumulative) per event.
  for (const row of data ?? []) {
    if (!summaries.has(row.event_id)) {
      summaries.set(row.event_id, {
        totalPlays: row.total_plays ?? 0,
        totalLeads: row.total_leads ?? 0,
      });
    }
  }
  return summaries;
}
