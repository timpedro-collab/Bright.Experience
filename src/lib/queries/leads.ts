/** Supabase read queries for captured event leads. */
import { createClient } from "@/lib/supabase/server";

/** Fetch all leads captured at an event, newest first. */
export async function getLeadsByEvent(eventId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("leads")
    .select(
      "id, event_id, machine_instance_id, contact_name, contact_email, contact_phone, custom_fields_json, source, captured_at"
    )
    .eq("event_id", eventId)
    .order("captured_at", { ascending: false });

  if (error || !data) return [];
  return data;
}

/** Return the total number of leads captured at an event. */
export async function getLeadCount(eventId: string) {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("leads")
    .select("id", { count: "exact", head: true })
    .eq("event_id", eventId);

  if (error) return 0;
  return count ?? 0;
}
