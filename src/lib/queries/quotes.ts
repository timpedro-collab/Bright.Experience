/** Supabase read queries for the quotes entity. */
import { createClient } from "@/lib/supabase/server";
import { PAGE_SIZE, paginateQuery, totalPages } from "@/lib/pagination";

const QUOTE_LIST_COLUMNS = `id, track, status, contact_name, contact_email, company_name,
       package_id, event_type, venue_name, postcode, location_postcode,
       event_date_start, event_date_end, total_amount,
       created_at, updated_at`;

/** Fetch all quotes, ordered by most recent first. */
export async function getQuotes() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("quotes")
    .select(QUOTE_LIST_COLUMNS)
    .order("created_at", { ascending: false });

  if (error || !data) return [];
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
  if (error || !data) return { data: [], totalCount: 0, totalPages: 1 };

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

  if (error || !data) return [];
  return data.filter((q) => {
    const status = String(q.status ?? "");
    if (TERMINAL_QUOTE_STATUSES.has(status)) return false;
    // Already provisioned into an event — the customer belongs in that
    // workspace, not the "awaiting confirmation" holding state.
    if ((q as { event_id?: string | null }).event_id) return false;
    return true;
  });
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

  if (error || !data) return null;
  return data;
}
