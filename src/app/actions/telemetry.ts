/** Server actions for live event telemetry and lead capture. */
"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

/** Ingest a telemetry event from a machine, resolved by serial number. */
export async function ingestTelemetry(data: {
  machineSerial: string;
  eventId: string;
  eventType: string;
  payload?: Record<string, unknown>;
}) {
  const supabase = await createClient();

  const { data: instance, error: lookupError } = await supabase
    .from("machine_instances")
    .select("id")
    .eq("serial_number", data.machineSerial)
    .single();

  if (lookupError || !instance) {
    return { success: false as const, error: "Machine instance not found" };
  }

  const { error } = await supabase.from("telemetry_events").insert({
    machine_instance_id: instance.id,
    event_id: data.eventId,
    event_type: data.eventType,
    payload_json: data.payload ?? {},
  });

  if (error) {
    return { success: false as const, error: "Failed to ingest telemetry" };
  }

  return { success: true as const, data: { machineInstanceId: instance.id } };
}

/** Capture a lead from an event interaction. */
export async function captureLead(data: {
  eventId: string;
  machineInstanceId?: string;
  contactName: string;
  contactEmail: string;
  contactPhone?: string;
  customFields?: Record<string, unknown>;
}) {
  const supabase = await createClient();

  const { data: lead, error } = await supabase
    .from("leads")
    .insert({
      event_id: data.eventId,
      machine_instance_id: data.machineInstanceId ?? null,
      contact_name: data.contactName,
      contact_email: data.contactEmail,
      contact_phone: data.contactPhone ?? null,
      custom_fields_json: data.customFields ?? {},
      source: "game",
    })
    .select("id")
    .single();

  if (error || !lead) {
    return { success: false as const, error: "Failed to capture lead" };
  }

  revalidatePath("/admin/events");
  return { success: true as const, data: { id: lead.id } };
}

/** Update the last heartbeat timestamp for a machine by serial number. */
export async function updateMachineHeartbeat(serial: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("machine_instances")
    .update({ last_heartbeat: new Date().toISOString() })
    .eq("serial_number", serial);

  if (error) {
    return { success: false as const, error: "Failed to update heartbeat" };
  }

  return { success: true as const, data: { serial } };
}

/** Recalculate today's event_metrics_snapshot by aggregating telemetry_events. */
export async function refreshEventMetrics(eventId: string) {
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);
  const startOfDay = `${today}T00:00:00.000Z`;
  const endOfDay = `${today}T23:59:59.999Z`;

  const [playsRes, interactionsRes, leadsRes, prizesRes] = await Promise.all([
    supabase
      .from("telemetry_events")
      .select("id", { count: "exact", head: true })
      .eq("event_id", eventId)
      .in("event_type", ["play_started", "play_completed"])
      .gte("timestamp", startOfDay)
      .lte("timestamp", endOfDay),
    supabase
      .from("telemetry_events")
      .select("id", { count: "exact", head: true })
      .eq("event_id", eventId)
      .neq("event_type", "heartbeat")
      .gte("timestamp", startOfDay)
      .lte("timestamp", endOfDay),
    supabase
      .from("leads")
      .select("id", { count: "exact", head: true })
      .eq("event_id", eventId)
      .gte("captured_at", startOfDay)
      .lte("captured_at", endOfDay),
    supabase
      .from("telemetry_events")
      .select("id", { count: "exact", head: true })
      .eq("event_id", eventId)
      .eq("event_type", "prize_awarded")
      .gte("timestamp", startOfDay)
      .lte("timestamp", endOfDay),
  ]);

  const { error } = await supabase
    .from("event_metrics_snapshot")
    .upsert(
      {
        event_id: eventId,
        snapshot_date: today,
        total_plays: playsRes.count ?? 0,
        total_interactions: interactionsRes.count ?? 0,
        total_leads: leadsRes.count ?? 0,
        total_prizes: prizesRes.count ?? 0,
      },
      { onConflict: "event_id,snapshot_date" }
    );

  if (error) {
    return { success: false as const, error: "Failed to refresh metrics" };
  }

  revalidatePath(`/events/${eventId}`);
  revalidatePath(`/admin/events/${eventId}`);
  return { success: true as const, data: { date: today } };
}
