/** Supabase read queries for physical machine instances. */
import { createClient } from "@/lib/supabase/server";
import type { FleetMachine } from "@/lib/configuration/resolve-config";
import type { MachineMission } from "@/types";
import { logQueryError } from "@/lib/observability/log-query-error";

/** Columns shared by the instance reads below. */
const INSTANCE_COLUMNS =
  "id, machine_type_id, serial_number, nickname, current_event_id, current_placement_id, zone, mission, status, last_heartbeat, firmware_version, created_at, updated_at";
/**
 * Catalog machine slugs for the instances deployed to an event.
 * Used to resolve which machine variant drives the on-machine asset previews.
 */
export async function getMachineSlugsByEvent(eventId: string): Promise<string[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("machine_instances")
    .select("machines:machine_type_id(slug)")
    .eq("current_event_id", eventId);

  if (error || !data) {
    logQueryError("getMachineSlugsByEvent", error, { eventId });
    return [];
  }
  return data
    .map((row) => {
      const machines = (row as { machines?: { slug?: string } | { slug?: string }[] }).machines;
      if (Array.isArray(machines)) return machines[0]?.slug;
      return machines?.slug;
    })
    .filter((slug): slug is string => Boolean(slug));
}

/** Fetch all machine instances currently deployed to a specific event. */
export async function getMachineInstancesByEvent(eventId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("machine_instances")
    .select(INSTANCE_COLUMNS)
    .eq("current_event_id", eventId)
    .order("serial_number");

  if (error || !data) {
    logQueryError("getMachineInstancesByEvent", error, { eventId });
    return [];
  }
  return data;
}

/**
 * The fleet deployed to a show, shaped for configuration resolution and the
 * fleet board. Ordered by serial number so zone grouping is stable.
 */
export async function getFleetByEvent(eventId: string): Promise<FleetMachine[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("machine_instances")
    .select("id, serial_number, nickname, zone, mission")
    .eq("current_event_id", eventId)
    .order("serial_number");

  if (error || !data) {
    logQueryError("getFleetByEvent", error, { eventId });
    return [];
  }
  return (data as Record<string, unknown>[]).map((m) => ({
    id: m.id as string,
    serialNumber: m.serial_number as string,
    nickname: (m.nickname as string | null) ?? undefined,
    zone: (m.zone as string | null) ?? null,
    mission: (m.mission as MachineMission | null) ?? null,
  }));
}

/** Compact machine rows for the live print dashboard. */
export async function getMachineInstanceSummariesByEvent(eventId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("machine_instances")
    .select("serial_number, nickname, status, last_heartbeat")
    .eq("current_event_id", eventId);

  if (error || !data) {
    logQueryError("getMachineInstanceSummariesByEvent", error, { eventId });
    return [];
  }
  return data as Array<{
    serial_number: string;
    nickname: string | null;
    status: string;
    last_heartbeat: string | null;
  }>;
}
