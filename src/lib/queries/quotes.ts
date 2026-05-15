/** Supabase read queries for the quotes entity. */
import { createClient } from "@/lib/supabase/server";

/** Fetch all quotes, ordered by most recent first. */
export async function getQuotes() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("quotes")
    .select(
      `id, track, status, contact_name, contact_email, company_name,
       package_id, event_type, venue_name, postcode,
       event_date_start, event_date_end, total_amount,
       created_at, updated_at`
    )
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return data;
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
