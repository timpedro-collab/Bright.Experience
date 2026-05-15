/** Supabase read queries for placement entities. */
import { createClient } from "@/lib/supabase/server";

/** Fetch all placements for a given venue, most recent first. */
export async function getPlacementsByVenue(venueId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("placements")
    .select(
      `id, venue_id, machine_instance_id, start_date, end_date,
       status, pricing_model_json, notes, created_at, updated_at,
       machine_instances ( id, serial_number, nickname )`
    )
    .eq("venue_id", venueId)
    .order("start_date", { ascending: false });

  if (error || !data) return [];
  return data;
}

/** Fetch all currently active placements across all venues. */
export async function getActivePlacements() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("placements")
    .select(
      `id, venue_id, machine_instance_id, start_date, end_date,
       status, pricing_model_json, notes, created_at, updated_at,
       venues ( id, name, slug ),
       machine_instances ( id, serial_number, nickname )`
    )
    .eq("status", "active")
    .order("start_date", { ascending: true });

  if (error || !data) return [];
  return data;
}
