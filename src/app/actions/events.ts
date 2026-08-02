/** Server actions for the events entity (create, update, duplicate). */
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";
import { isInternalRole } from "@/lib/roles";
import { enqueueDealKickoff } from "@/lib/pipedrive/triggers";
import { normalisePipedriveDealId } from "@/lib/pipedrive/normalise";
import { expandTemplate } from "@/server/expand-template";
import { writeAudit } from "@/lib/audit";
import { logQueryError } from "@/lib/observability/log-query-error";
import {
  createEventSchema,
  setEventHealthSchema,
  type CreateEventInput,
  type SetEventHealthInput,
} from "@/lib/validations/events";
import type { ActionResult } from "@/types/actions";

// No type re-export here: a "use server" module may only export async
// functions, and the actions loader turns anything else into a runtime
// re-export that throws on module evaluation. Import `CreateEventInput`
// from `@/lib/validations/events` instead.

export async function createEvent(
  input: CreateEventInput,
): Promise<ActionResult<{ id: string }>> {
  const user = await getUser();
  if (!user || !isInternalRole(user.role)) {
    return { success: false, error: "Only internal users can create events." };
  }

  const parsed = createEventSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input.",
    };
  }

  const supabase = await createClient();
  const dealId = normalisePipedriveDealId(parsed.data.pipedriveDealId);
  const { data, error } = await supabase
    .from("events")
    .insert({
      account_id: parsed.data.accountId,
      name: parsed.data.name,
      event_type: parsed.data.eventType,
      package_type: parsed.data.packageType,
      machine_type: parsed.data.machineType || null,
      venue_name: parsed.data.venueName || null,
      venue_address: parsed.data.venueAddress || null,
      event_date_start: parsed.data.eventDateStart,
      event_date_end: parsed.data.eventDateEnd || null,
      created_by: user.id,
      pipedrive_deal_id: dealId,
      pipedrive_linked_at: dealId ? new Date().toISOString() : null,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { success: false, error: "Could not create event. Please try again." };
  }

  if (dealId) {
    await enqueueDealKickoff(data.id as string);
  }

  if (parsed.data.templateId) {
    await expandTemplate(data.id as string, parsed.data.templateId);
  }

  revalidatePath("/");
  revalidatePath("/pipeline");
  revalidatePath("/ops");
  return { success: true, data: { id: data.id as string } };
}

export async function duplicateEvent(
  eventId: string,
): Promise<ActionResult<{ id: string }>> {
  const user = await getUser();
  if (!user || !isInternalRole(user.role)) {
    return { success: false, error: "Only internal users can duplicate events." };
  }

  const supabase = await createClient();
  const { data: source, error: readErr } = await supabase
    .from("events")
    .select("*")
    .eq("id", eventId)
    .single();

  if (readErr || !source) {
    return { success: false, error: "Could not load source event." };
  }

  const { data: copy, error: insErr } = await supabase
    .from("events")
    .insert({
      account_id: source.account_id,
      name: `${source.name} (copy)`,
      event_type: source.event_type,
      package_type: source.package_type,
      machine_type: source.machine_type,
      venue_name: source.venue_name,
      venue_address: source.venue_address,
      event_date_start: source.event_date_start,
      event_date_end: source.event_date_end,
      current_stage: "confirmed",
      health_status: "green",
      created_by: user.id,
    })
    .select("id")
    .single();

  if (insErr || !copy) {
    return { success: false, error: "Could not duplicate event. Please try again." };
  }

  revalidatePath("/");
  revalidatePath("/pipeline");
  revalidatePath("/ops");
  return { success: true, data: { id: copy.id as string } };
}

/**
 * Flag an event amber or red by hand, or clear it back to green.
 *
 * `health_status` has always been on the events table and drives the delivery
 * queues, but nothing could write it after creation, so every event stayed
 * green however badly it was going. This is the write.
 *
 * Internal only, and never surfaced to the customer: `HealthBadge` renders a
 * calm "In progress" for them, and the reason is internal commentary.
 */
export async function setEventHealth(
  input: SetEventHealthInput,
): Promise<ActionResult<{ status: SetEventHealthInput["status"] }>> {
  const user = await getUser();
  if (!user || !isInternalRole(user.role)) {
    return { success: false, error: "Only the delivery team can flag an event." };
  }

  const parsed = setEventHealthSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input.",
    };
  }
  const { eventId, status } = parsed.data;
  const reason = status === "green" ? null : (parsed.data.reason?.trim() ?? null);

  const supabase = await createClient();
  // Selecting the row back is the only way to tell a real write from an
  // update that RLS filtered to zero rows — PostgREST reports both as success.
  const { data: updated, error } = await supabase
    .from("events")
    .update({
      health_status: status,
      // Green is the absence of a flag, not a flag of its own.
      health_override: status !== "green",
      health_reason: reason,
    })
    .eq("id", eventId)
    .select("id")
    .maybeSingle();

  if (error || !updated) {
    logQueryError("setEventHealth", error, { eventId, status });
    return { success: false, error: "Could not update the flag. Please try again." };
  }

  await writeAudit({
    eventId,
    actorId: user.id,
    action: status === "green" ? "health_cleared" : "health_flagged",
    entityType: "event",
    entityId: eventId,
    metadata: { status, reason, actorRole: user.role },
  });

  revalidatePath(`/events/${eventId}`);
  revalidatePath("/pipeline");
  revalidatePath("/ops");
  return { success: true, data: { status } };
}

/** Server-action wrapper used by progressive-enhancement forms. */
export async function createEventFromForm(formData: FormData) {
  const input: CreateEventInput = {
    accountId: String(formData.get("accountId") ?? ""),
    name: String(formData.get("name") ?? ""),
    eventType:
      (formData.get("eventType") as CreateEventInput["eventType"]) ??
      "activation",
    packageType:
      (formData.get("packageType") as CreateEventInput["packageType"]) ??
      "standard",
    machineType: (formData.get("machineType") as string) || undefined,
    venueName: (formData.get("venueName") as string) || undefined,
    venueAddress: (formData.get("venueAddress") as string) || undefined,
    eventDateStart: String(formData.get("eventDateStart") ?? ""),
    eventDateEnd: (formData.get("eventDateEnd") as string) || undefined,
    pipedriveDealId: (formData.get("pipedriveDealId") as string) || undefined,
  };
  const result = await createEvent(input);
  if (!result.success) {
    throw new Error(result.error);
  }
  redirect(`/events/${result.data.id}`);
}
