/** Server actions for live event telemetry and lead capture. */
"use server";

import { requireInternalUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import {
  ingestTelemetrySchema,
  captureLeadSchema,
} from "@/lib/validations/telemetry";

/** Ingest a telemetry event from a machine, resolved by serial number. */
export async function ingestTelemetry(data: {
  machineSerial: string;
  eventId: string;
  eventType: string;
  payload?: Record<string, unknown>;
}) {
  const parsed = ingestTelemetrySchema.safeParse(data);
  if (!parsed.success) {
    return { success: false as const, error: parsed.error.issues[0].message };
  }

  const { supabase } = await requireInternalUser();

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
  const parsed = captureLeadSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false as const, error: parsed.error.issues[0].message };
  }

  const { supabase } = await requireInternalUser();

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
  revalidatePath(`/events/${data.eventId}/leads`);
  revalidatePath(`/events/${data.eventId}/reports`);
  return { success: true as const, data: { id: lead.id } };
}

/** Update the last heartbeat timestamp for a machine by serial number. */
export async function updateMachineHeartbeat(serial: string) {
  const { supabase } = await requireInternalUser();

  const { error } = await supabase
    .from("machine_instances")
    .update({ last_heartbeat: new Date().toISOString() })
    .eq("serial_number", serial);

  if (error) {
    return { success: false as const, error: "Failed to update heartbeat" };
  }

  return { success: true as const, data: { serial } };
}
