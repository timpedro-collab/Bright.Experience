/** Supabase read queries for machine telemetry events. */
import { createClient } from "@/lib/supabase/server";
import { logQueryError } from "@/lib/observability/log-query-error";

/** Fetch recent telemetry for an event, newest first. */
export async function getTelemetryByEvent(
  eventId: string,
  limit: number = 100
) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("telemetry_events")
    .select(
      "id, machine_instance_id, event_id, event_type, payload_json, timestamp"
    )
    .eq("event_id", eventId)
    .order("timestamp", { ascending: false })
    .limit(limit);

  if (error || !data) {
    logQueryError("getTelemetryByEvent", error, { eventId });
    return [];
  }
  return data;
}
/**
 * Telemetry rows for a closed time window (e.g. same-day hourly chart).
 * Returns event_type + timestamp only — enough to bucket by hour.
 */
export async function getTelemetryInRange(
  eventId: string,
  startIso: string,
  endIso: string,
) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("telemetry_events")
    .select("event_type, timestamp")
    .eq("event_id", eventId)
    .gte("timestamp", startIso)
    .lte("timestamp", endIso)
    .order("timestamp");

  if (error || !data) {
    logQueryError("getTelemetryInRange", error, { eventId });
    return [];
  }
  return data as Array<{ event_type: string; timestamp: string }>;
}
