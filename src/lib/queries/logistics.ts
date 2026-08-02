/** Supabase queries for logistics entries */

import { createClient } from "@/lib/supabase/server";
import { logQueryError } from "@/lib/observability/log-query-error";

/** Fetch logistics entries for an event ordered by scheduled_date then sort_order */
export async function getLogisticsByEvent(eventId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("logistics_entries")
    .select("*")
    .eq("event_id", eventId)
    .order("scheduled_date")
    .order("sort_order");

  if (error || !data) {
    logQueryError("getLogisticsByEvent", error, { eventId });
    return [];
  }
  return data;
}
