/** Supabase read queries for sponsorship slot entities. */
import { createClient } from "@/lib/supabase/server";
import { logQueryError } from "@/lib/observability/log-query-error";

/** Fetch all sponsorship slots for a given placement. */
export async function getSlotsByPlacement(placementId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("sponsorship_slots")
    .select(
      `id, placement_id, sponsor_account_id, start_date, end_date,
       price, status, creative_asset_ids, game_config_json,
       created_at, updated_at`
    )
    .eq("placement_id", placementId)
    .order("start_date", { ascending: true });

  if (error || !data) {
    logQueryError("getSlotsByPlacement", error, { placementId });
    return [];
  }
  return data;
}

/** Fetch all available sponsorship slots across placements. */
export async function getAvailableSlots() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("sponsorship_slots")
    .select(
      `id, placement_id, start_date, end_date, price, status,
       created_at, updated_at,
       placements ( id, venue_id, start_date, end_date,
         venues ( id, name, slug )
       )`
    )
    .eq("status", "available")
    .order("start_date", { ascending: true });

  if (error || !data) {
    logQueryError("getAvailableSlots", error);
    return [];
  }
  return data;
}
