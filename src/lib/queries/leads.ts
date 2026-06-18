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

export interface LeadAggregates {
  total: number;
  today: number;
  topSource: string;
  /** Leads per hour across the active capture window (first → last lead). */
  perHour: number;
}

/**
 * Aggregate lead metrics across the WHOLE event, not just the current page.
 *
 * The leads table is paginated, so any headline computed from the page slice
 * (today's count, top source) would silently under-report once an event has
 * more than one page of leads. This scans the lightweight columns for the full
 * set so the headline cards are always accurate.
 */
export async function getLeadAggregates(eventId: string): Promise<LeadAggregates> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("leads")
    .select("source, captured_at")
    .eq("event_id", eventId)
    .order("captured_at", { ascending: true });

  if (error || !data || data.length === 0) {
    return { total: 0, today: 0, topSource: "—", perHour: 0 };
  }

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  let today = 0;
  const sourceMap: Record<string, number> = {};
  for (const lead of data as { source: string; captured_at: string }[]) {
    if (new Date(lead.captured_at) >= todayStart) today += 1;
    const src = lead.source || "unknown";
    sourceMap[src] = (sourceMap[src] ?? 0) + 1;
  }

  const topSource =
    Object.entries(sourceMap).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";

  const rows = data as { captured_at: string }[];
  const firstAt = new Date(rows[0].captured_at).getTime();
  const lastAt = new Date(rows[rows.length - 1].captured_at).getTime();
  const hours = Math.max((lastAt - firstAt) / 3_600_000, 1);
  const perHour = Math.round(data.length / hours);

  return { total: data.length, today, topSource, perHour };
}
