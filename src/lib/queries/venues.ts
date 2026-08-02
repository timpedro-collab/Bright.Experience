/** Supabase read queries for venue entities. */
import { createClient } from "@/lib/supabase/server";
import { logQueryError } from "@/lib/observability/log-query-error";

/** Fetch all active venues ordered by name (internal use). */
export async function getVenues() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("venues")
    .select(
      `id, partner_id, name, slug, address, postcode,
       location_tier, capacity, venue_type,
       contact_info_json, is_active, created_at, updated_at`
    )
    .order("name", { ascending: true });

  if (error || !data) {
    logQueryError("getVenues", error);
    return [];
  }
  return data;
}

/** Fetch a single venue by its unique slug. */
export async function getVenueBySlug(slug: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("venues")
    .select(
      `id, partner_id, name, slug, address, postcode,
       location_tier, capacity, venue_type,
       contact_info_json, is_active, created_at, updated_at`
    )
    .eq("slug", slug)
    .single();

  if (error || !data) {
    logQueryError("getVenueBySlug", error, { slug });
    return null;
  }
  return data;
}

/** Fetch all venues belonging to a specific partner. */
export async function getVenuesByPartner(partnerId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("venues")
    .select(
      `id, partner_id, name, slug, address, postcode,
       location_tier, capacity, venue_type,
       contact_info_json, is_active, created_at, updated_at`
    )
    .eq("partner_id", partnerId)
    .order("name", { ascending: true });

  if (error || !data) {
    logQueryError("getVenuesByPartner", error, { partnerId });
    return [];
  }
  return data;
}
