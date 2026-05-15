/** Supabase read queries for the location tiers entity. */
import { createClient } from "@/lib/supabase/server";

/** Fetch all location tiers, ordered by postcode prefix. */
export async function getLocations() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("location_tiers")
    .select("id, postcode_prefix, name, region, tier, multiplier")
    .order("postcode_prefix");

  if (error || !data) return [];
  return data;
}

/** Fetch a single location tier by postcode prefix. */
export async function getLocationByPostcode(prefix: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("location_tiers")
    .select("id, postcode_prefix, name, region, tier, multiplier")
    .eq("postcode_prefix", prefix.toUpperCase())
    .single();

  if (error || !data) return null;
  return data;
}
