/** Supabase read queries for aggregated event metrics snapshots. */
import { createClient } from "@/lib/supabase/server";

/** Fetch all daily metric snapshots for an event, oldest first. */
export async function getEventMetrics(eventId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("event_metrics_snapshot")
    .select(
      "id, event_id, snapshot_date, total_plays, total_interactions, total_leads, total_prizes, avg_dwell_time, peak_hour, custom_json, created_at, updated_at"
    )
    .eq("event_id", eventId)
    .order("snapshot_date");

  if (error || !data) return [];
  return data;
}

/** Fetch the most recent daily metrics snapshot for an event. */
export async function getLatestEventMetrics(eventId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("event_metrics_snapshot")
    .select(
      "id, event_id, snapshot_date, total_plays, total_interactions, total_leads, total_prizes, avg_dwell_time, peak_hour, custom_json, created_at, updated_at"
    )
    .eq("event_id", eventId)
    .order("snapshot_date", { ascending: false })
    .limit(1)
    .single();

  if (error || !data) return null;
  return data;
}
