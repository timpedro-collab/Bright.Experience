/** Supabase read queries for placement entities. */
import { createClient } from "@/lib/supabase/server";
import { logQueryError } from "@/lib/observability/log-query-error";

/**
 * `placements` and `machine_instances` reference each other — placements point
 * at the unit, and `machine_instances.current_placement_id` points back — so
 * PostgREST refuses a bare `machine_instances(...)` embed as ambiguous. Naming
 * the constraint picks the "unit on this placement" direction.
 */
const MACHINE_ON_PLACEMENT =
  "machine_instances!placements_machine_instance_id_fkey ( id, serial_number, nickname )";

/** Fetch all placements for a given venue, most recent first. */
export async function getPlacementsByVenue(venueId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("placements")
    .select(
      `id, venue_id, machine_instance_id, start_date, end_date,
       status, pricing_model_json, notes, created_at, updated_at,
       ${MACHINE_ON_PLACEMENT}`
    )
    .eq("venue_id", venueId)
    .order("start_date", { ascending: false });

  if (error || !data) {
    logQueryError("getPlacementsByVenue", error, { venueId });
    return [];
  }
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
       ${MACHINE_ON_PLACEMENT}`
    )
    .eq("status", "active")
    .order("start_date", { ascending: true });

  if (error || !data) {
    logQueryError("getActivePlacements", error);
    return [];
  }
  return data;
}
