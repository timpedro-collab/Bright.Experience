/** Supabase read queries for the locations entity. */
import { createClient } from "@/lib/supabase/server";
import { PAGE_SIZE, paginateQuery, totalPages } from "@/lib/pagination";
import { logQueryError } from "@/lib/observability/log-query-error";

const LOCATION_COLUMNS =
  "postcode_prefix, name, region, tier, footfall_index, media_value_multiplier, notes";

/** Fetch all locations, ordered by postcode prefix. */
export async function getLocations() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("locations")
    .select(LOCATION_COLUMNS)
    .order("postcode_prefix");

  if (error || !data) {
    logQueryError("getLocations", error);
    return [];
  }
  return data;
}

/** Paginated location list for admin views. */
export async function getLocationsPaginated(
  page: number = 1,
  pageSize: number = PAGE_SIZE
) {
  const supabase = await createClient();
  const query = supabase
    .from("locations")
    .select(LOCATION_COLUMNS, { count: "exact" })
    .order("postcode_prefix");

  const { data, error, count } = await paginateQuery(query, page, pageSize);
  if (error || !data) {
    logQueryError("getLocationsPaginated", error);
    return { data: [], totalCount: 0, totalPages: 1 };
  }

  const total = count ?? 0;
  return { data, totalCount: total, totalPages: totalPages(total, pageSize) };
}
