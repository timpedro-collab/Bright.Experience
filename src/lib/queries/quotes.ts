/** Supabase read queries for the quotes entity. */
import { createClient } from "@/lib/supabase/server";
import { PAGE_SIZE, paginateQuery, totalPages } from "@/lib/pagination";
import { logQueryError } from "@/lib/observability/log-query-error";

const QUOTE_LIST_COLUMNS = `id, track, status, contact_name, contact_email, company_name,
       package_id, event_type, venue_name, postcode,
       event_date_start, event_date_end, total_amount,
       reach_track, attendees, activation_location, activation_days,
       estimated_impressions, dooh_media_value,
       walkthrough_scheduled_at, walkthrough_slot_label, walkthrough_completed_at,
       created_at, updated_at`;

/** Fetch all quotes, ordered by most recent first. */
export async function getQuotes() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("quotes")
    .select(QUOTE_LIST_COLUMNS)
    .order("created_at", { ascending: false });

  if (error || !data) {
    logQueryError("getQuotes", error);
    return [];
  }
  return data;
}

/** Paginated quote list for the admin queue. */
export async function getQuotesPaginated(
  page: number = 1,
  pageSize: number = PAGE_SIZE
) {
  const supabase = await createClient();
  const query = supabase
    .from("quotes")
    .select(QUOTE_LIST_COLUMNS, { count: "exact" })
    .order("created_at", { ascending: false });

  const { data, error, count } = await paginateQuery(query, page, pageSize);
  if (error || !data) {
    logQueryError("getQuotesPaginated", error);
    return { data: [], totalCount: 0, totalPages: 1 };
  }

  const total = count ?? 0;
  return { data, totalCount: total, totalPages: totalPages(total, pageSize) };
}

/**
 * In-flight quotes for a logged-in customer, matched on contact email.
 * Used to show a real "proposal in progress / awaiting confirmation" state
 * instead of dropping a customer with no event back into the public funnel.
 * Returns [] gracefully (incl. when RLS hides quotes from this viewer).
 *
 * A quote is "in flight" when it is neither terminal nor already converted
 * into an event workspace. The old filter only matched statuses the booking
 * flow never actually writes ("converted"/"cancelled"/"closed") while missing
 * the real conversion signal — a populated `event_id` — so a customer whose
 * quote had already become an event stayed stuck on the holding screen.
 */
const TERMINAL_QUOTE_STATUSES = new Set([
  "rejected",
  "declined",
  "expired",
  "cancelled",
  "closed",
  "converted",
]);

export async function getPendingQuotesForCustomer(email?: string) {
  if (!email) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("quotes")
    .select(`${QUOTE_LIST_COLUMNS}, event_id`)
    .eq("contact_email", email)
    .order("created_at", { ascending: false });

  if (error || !data) {
    logQueryError("getPendingQuotesForCustomer", error);
    return [];
  }
  return data.filter((q) => {
    const status = String(q.status ?? "");
    if (TERMINAL_QUOTE_STATUSES.has(status)) return false;
    // Already provisioned into an event — the customer belongs in that
    // workspace, not the "awaiting confirmation" holding state.
    if ((q as { event_id?: string | null }).event_id) return false;
    return true;
  });
}

export interface UpcomingWalkthrough {
  id: string;
  contactName: string;
  companyName: string | null;
  slotLabel: string | null;
  scheduledAt: string;
}

/**
 * Booked-but-not-yet-held proposal walkthroughs, soonest first. Drives the
 * "Walkthrough booked" focus item on the event lead's home.
 */
export async function getUpcomingWalkthroughs(): Promise<UpcomingWalkthrough[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("quotes")
    .select(
      `id, contact_name, company_name, walkthrough_scheduled_at, walkthrough_slot_label, walkthrough_completed_at`,
    );
  if (error || !data) {
    logQueryError("getUpcomingWalkthroughs", error);
    return [];
  }

  const cutoff = Date.now() - 60 * 60 * 1000; // keep meetings until an hour past
  return data
    .filter((q) => {
      const at = (q as Record<string, unknown>).walkthrough_scheduled_at as string | null;
      const done = (q as Record<string, unknown>).walkthrough_completed_at as string | null;
      if (!at || done) return false;
      return new Date(at).getTime() > cutoff;
    })
    .map((q) => {
      const r = q as Record<string, unknown>;
      return {
        id: r.id as string,
        contactName: (r.contact_name as string) ?? "Customer",
        companyName: (r.company_name as string) ?? null,
        slotLabel: (r.walkthrough_slot_label as string) ?? null,
        scheduledAt: r.walkthrough_scheduled_at as string,
      };
    })
    .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt));
}

/** Fetch a single quote by ID with its line items. */
export async function getQuoteById(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("quotes")
    .select(
      `*, quote_line_items ( id, label, amount, category, sort_order )`
    )
    .eq("id", id)
    .single();

  if (error || !data) {
    logQueryError("getQuoteById", error, { id });
    return null;
  }
  return data;
}
