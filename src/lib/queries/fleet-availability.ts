/**
 * Fleet-availability read — the raw fleet, event, and placement rows behind
 * the pricing page's honest "N of M units booked" module.
 */
import { createClient } from "@/lib/supabase/server";
import {
  computeMonthAvailability,
  type FleetRows,
  type MonthAvailability,
} from "@/lib/pricing/fleet-availability";
import { logQueryError } from "@/lib/observability/log-query-error";

/**
 * Availability for each requested month ("YYYY-MM"), derived from the real
 * booking calendar. Returns an empty array when any read fails so the
 * pricing page simply omits the module rather than showing made-up scarcity.
 */
export async function getFleetMonthAvailability(
  months: string[],
): Promise<MonthAvailability[]> {
  if (months.length === 0) return [];
  const supabase = await createClient();

  const [instancesRes, eventsRes, placementsRes] = await Promise.all([
    supabase
      .from("machine_instances")
      .select("id, current_event_id")
      .limit(1000),
    supabase
      .from("events")
      .select("id, event_date_start, event_date_end, stage")
      .limit(1000),
    supabase
      .from("placements")
      .select("machine_instance_id, start_date, end_date, status")
      .limit(1000),
  ]);

  if (instancesRes.error || eventsRes.error || placementsRes.error) {
    logQueryError(
      "getFleetMonthAvailability",
      instancesRes.error ?? eventsRes.error ?? placementsRes.error,
      { months: months.join(",") },
    );
    return [];
  }

  const rows: FleetRows = {
    instances: (instancesRes.data ?? []) as FleetRows["instances"],
    events: (eventsRes.data ?? []) as FleetRows["events"],
    placements: (placementsRes.data ?? []) as FleetRows["placements"],
  };

  return months.map((month) => computeMonthAvailability(rows, month));
}
