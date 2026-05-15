/** Supabase read queries for machine telemetry events. */
import { createClient } from "@/lib/supabase/server";

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

  if (error || !data) return [];
  return data;
}

/** Fetch telemetry for an event filtered by a specific event type. */
export async function getTelemetryByType(eventId: string, eventType: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("telemetry_events")
    .select(
      "id, machine_instance_id, event_id, event_type, payload_json, timestamp"
    )
    .eq("event_id", eventId)
    .eq("event_type", eventType)
    .order("timestamp", { ascending: false });

  if (error || !data) return [];
  return data;
}
