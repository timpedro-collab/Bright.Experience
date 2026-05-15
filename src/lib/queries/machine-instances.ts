/** Supabase read queries for physical machine instances. */
import { createClient } from "@/lib/supabase/server";

/** Fetch all machine instances (internal use). */
export async function getMachineInstances() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("machine_instances")
    .select(
      "id, machine_type_id, serial_number, nickname, current_event_id, current_placement_id, status, last_heartbeat, firmware_version, created_at, updated_at"
    )
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return data;
}

/** Fetch a single machine instance by its unique serial number. */
export async function getMachineInstanceBySerial(serial: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("machine_instances")
    .select(
      "id, machine_type_id, serial_number, nickname, current_event_id, current_placement_id, status, last_heartbeat, firmware_version, created_at, updated_at"
    )
    .eq("serial_number", serial)
    .single();

  if (error || !data) return null;
  return data;
}

/** Fetch all machine instances currently deployed to a specific event. */
export async function getMachineInstancesByEvent(eventId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("machine_instances")
    .select(
      "id, machine_type_id, serial_number, nickname, current_event_id, current_placement_id, status, last_heartbeat, firmware_version, created_at, updated_at"
    )
    .eq("current_event_id", eventId)
    .order("serial_number");

  if (error || !data) return [];
  return data;
}
