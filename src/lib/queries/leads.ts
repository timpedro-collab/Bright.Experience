/** Supabase read queries for captured event leads. */
import { createClient } from "@/lib/supabase/server";
import { PAGE_SIZE, paginateQuery, totalPages } from "@/lib/pagination";
import { logQueryError } from "@/lib/observability/log-query-error";

const LEAD_COLUMNS =
  "id, event_id, machine_instance_id, contact_name, contact_email, contact_phone, custom_fields_json, source, captured_at, consented_at";

/** Safety cap for aggregate scans — enough for headline metrics, not unbounded. */
const MAX_LEAD_AGGREGATE_ROWS = 10_000;

/**
 * Paginated leads for the leads table view.
 *
 * The count here only sizes the pager, so it asks for `estimated` rather than
 * `exact`: PostgREST answers exactly up to its `db-max-rows` threshold and
 * falls back to the planner's estimate above it, which keeps a busy event's
 * lead table from paying for a full count scan on every page turn. The
 * headline "N contacts captured" figure on the same page comes from
 * {@link getLeadCount}, which stays exact because that number is read as fact.
 */
export async function getLeadsByEventPaginated(
  eventId: string,
  page: number = 1,
  pageSize: number = PAGE_SIZE
) {
  const supabase = await createClient();
  const query = supabase
    .from("leads")
    .select(LEAD_COLUMNS, { count: "estimated" })
    .eq("event_id", eventId)
    .order("captured_at", { ascending: false });

  const { data, error, count } = await paginateQuery(query, page, pageSize);
  if (error || !data) {
    logQueryError("getLeadsByEventPaginated", error, { eventId });
    return { data: [], totalCount: 0, totalPages: 1 };
  }

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

  if (error) {
    logQueryError("getLeadCount", error, { eventId });
    return 0;
  }
  return count ?? 0;
}

export interface LeadAggregates {
  total: number;
  today: number;
  topSource: string;
  /** Leads per hour across the active capture window (first → last lead). */
  perHour: number;
  /** Age-band → percentage of leads, ordered youngest to oldest. */
  ageBands: { band: string; count: number; pct: number }[];
  /** Average age across leads that carry an age, or null if none do. */
  avgAge: number | null;
}

const AGE_BAND_ORDER = ["18-24", "25-34", "35-44", "45-54", "55+"];

/** Map a numeric age to its reporting band. */
function ageToBand(age: number): string {
  if (age < 25) return "18-24";
  if (age < 35) return "25-34";
  if (age < 45) return "35-44";
  if (age < 55) return "45-54";
  return "55+";
}

/**
 * Aggregate lead metrics across the WHOLE event, not just the current page.
 *
 * The leads table is paginated, so any headline computed from the page slice
 * (today's count, top source) would silently under-report once an event has
 * more than one page of leads. This scans the lightweight columns for the full
 * set so the headline cards are always accurate.
 *
 * Safety: capped at {@link MAX_LEAD_AGGREGATE_ROWS} so a pathological event
 * cannot unbounded-scan forever. Events above that cap should move to SQL
 * aggregates / a metrics snapshot.
 */
export async function getLeadAggregates(eventId: string): Promise<LeadAggregates> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("leads")
    .select("source, captured_at, custom_fields_json")
    .eq("event_id", eventId)
    .order("captured_at", { ascending: true })
    .limit(MAX_LEAD_AGGREGATE_ROWS);

  if (error || !data || data.length === 0) {
    return { total: 0, today: 0, topSource: "—", perHour: 0, ageBands: [], avgAge: null };
  }

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  let today = 0;
  const sourceMap: Record<string, number> = {};
  const bandMap: Record<string, number> = {};
  let ageSum = 0;
  let ageCount = 0;
  type LeadRow = {
    source: string;
    captured_at: string;
    custom_fields_json?: { age?: number } | null;
  };
  for (const lead of data as LeadRow[]) {
    if (new Date(lead.captured_at) >= todayStart) today += 1;
    const src = lead.source || "unknown";
    sourceMap[src] = (sourceMap[src] ?? 0) + 1;
    const age = lead.custom_fields_json?.age;
    if (typeof age === "number" && Number.isFinite(age)) {
      const band = ageToBand(age);
      bandMap[band] = (bandMap[band] ?? 0) + 1;
      ageSum += age;
      ageCount += 1;
    }
  }

  const topSource =
    Object.entries(sourceMap).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";

  const rows = data as { captured_at: string }[];
  const firstAt = new Date(rows[0].captured_at).getTime();
  const lastAt = new Date(rows[rows.length - 1].captured_at).getTime();
  const hours = Math.max((lastAt - firstAt) / 3_600_000, 1);
  const perHour = Math.round(data.length / hours);

  const ageBands = AGE_BAND_ORDER.filter((b) => bandMap[b] > 0).map((band) => ({
    band,
    count: bandMap[band],
    pct: Math.round((bandMap[band] / ageCount) * 100),
  }));
  const avgAge = ageCount > 0 ? Math.round(ageSum / ageCount) : null;

  return { total: data.length, today, topSource, perHour, ageBands, avgAge };
}
