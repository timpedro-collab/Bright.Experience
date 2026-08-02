/** Supabase read queries for venue packages (rate-card / turnkey buys). */

import { createClient } from "@/lib/supabase/server";
import { logQueryError } from "@/lib/observability/log-query-error";

export interface VenuePackageRow {
  id: string;
  name: string;
  description: string | null;
  price: number | null;
  includes_bright_blue: boolean;
  sort_order?: number;
}

/** Packages for a venue, ordered by sort_order ascending. */
export async function getVenuePackagesByVenueId(
  venueId: string,
): Promise<VenuePackageRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("venue_packages")
    .select("id, name, description, price, includes_bright_blue, sort_order")
    .eq("venue_id", venueId)
    .order("sort_order", { ascending: true });

  if (error || !data) {
    logQueryError("getVenuePackagesByVenueId", error, { venueId });
    return [];
  }
  return data as VenuePackageRow[];
}
