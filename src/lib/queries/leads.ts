/** Supabase read queries for captured event leads. */
import { createClient } from "@/lib/supabase/server";
import { PAGE_SIZE, paginateQuery, totalPages } from "@/lib/pagination";

const LEAD_COLUMNS =
  "id, event_id, machine_instance_id, contact_name, contact_email, contact_phone, custom_fields_json, source, captured_at";

/** Fetch all leads captured at an event, newest first. */
export async function getLeadsByEvent(eventId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("leads")
    .select(LEAD_COLUMNS)
    .eq("event_id", eventId)
    .order("captured_at", { ascending: false });

  if (error || !data) return [];
  return data;
}

/** Paginated leads for the leads table view. */
export async function getLeadsByEventPaginated(
  eventId: string,
  page: number = 1,
  pageSize: number = PAGE_SIZE
) {
  const supabase = await createClient();
  const query = supabase
    .from("leads")
    .select(LEAD_COLUMNS, { count: "exact" })
    .eq("event_id", eventId)
    .order("captured_at", { ascending: false });

  const { data, error, count } = await paginateQuery(query, page, pageSize);
  if (error || !data) return { data: [], totalCount: 0, totalPages: 1 };

  const total = count ?? 0;
  return { data, totalCount: total, totalPages: totalPages(total, pageSize) };
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
