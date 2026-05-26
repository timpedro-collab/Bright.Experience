/** Server actions for the events entity (create, update, duplicate). */
"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";
import { isInternalRole } from "@/lib/roles";
import { enqueueDealKickoff } from "@/lib/pipedrive/triggers";

const createEventSchema = z.object({
  accountId: z.string().uuid("Select a customer account"),
  name: z.string().min(2, "Give your event a name"),
  eventType: z.enum(["activation", "sampling", "vending", "hybrid", "custom"]),
  packageType: z.enum(["standard", "premium", "custom"]).default("standard"),
  machineType: z.string().optional(),
  venueName: z.string().optional(),
  venueAddress: z.string().optional(),
  eventDateStart: z.string().min(1, "Pick a start date"),
  eventDateEnd: z.string().optional(),
  templateId: z.string().uuid().optional(),
  pipedriveDealId: z.string().optional(),
});

/**
 * Normalise a Pipedrive deal reference. Accepts either a numeric ID
 * (`"1234"`), a full deal URL (`https://acme.pipedrive.com/deal/1234`),
 * or the empty string. Returns the numeric ID as a string, or null.
 */
export function normalisePipedriveDealId(raw?: string): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (trimmed === "") return null;
  // Match the trailing numeric segment of a Pipedrive URL or a bare ID.
  const match = trimmed.match(/(\d+)\/?$/);
  return match ? match[1] : null;
}

export type CreateEventInput = z.infer<typeof createEventSchema>;

export async function createEvent(input: CreateEventInput): Promise<{ id: string }> {
  const user = await getUser();
  if (!user || !isInternalRole(user.role)) {
    throw new Error("Only internal users can create events");
  }

  const parsed = createEventSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid input");
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
    throw new Error(error?.message ?? "Failed to create event");
  }

  // Pipedrive: first note on the deal once we have a linked event.
  if (dealId) {
    await enqueueDealKickoff(data.id as string);
  }

  revalidatePath("/");
  return { id: data.id as string };
}

export async function duplicateEvent(eventId: string): Promise<{ id: string }> {
  const user = await getUser();
  if (!user || !isInternalRole(user.role)) {
    throw new Error("Only internal users can duplicate events");
  }

  const supabase = await createClient();
  const { data: source, error: readErr } = await supabase
    .from("events")
    .select("*")
    .eq("id", eventId)
    .single();
  if (readErr || !source) throw new Error("Could not load source event");

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

  if (insErr || !copy) throw new Error(insErr?.message ?? "Failed to duplicate event");
  revalidatePath("/");
  return { id: copy.id as string };
}

/** Server-action wrapper used by progressive-enhancement forms. */
export async function createEventFromForm(formData: FormData) {
  const input: CreateEventInput = {
    accountId: String(formData.get("accountId") ?? ""),
    name: String(formData.get("name") ?? ""),
    eventType: (formData.get("eventType") as CreateEventInput["eventType"]) ?? "activation",
    packageType: (formData.get("packageType") as CreateEventInput["packageType"]) ?? "standard",
    machineType: (formData.get("machineType") as string) || undefined,
    venueName: (formData.get("venueName") as string) || undefined,
    venueAddress: (formData.get("venueAddress") as string) || undefined,
    eventDateStart: String(formData.get("eventDateStart") ?? ""),
    eventDateEnd: (formData.get("eventDateEnd") as string) || undefined,
    pipedriveDealId: (formData.get("pipedriveDealId") as string) || undefined,
  };
  const { id } = await createEvent(input);
  redirect(`/events/${id}`);
}
