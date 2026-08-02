/**
 * Service-role event creation for system flows.
 *
 * Server-only internal, not a Server Action. This bypasses the `isInternalRole`
 * check that `createEvent` enforces, so while it was exported from a
 * `"use server"` module any unauthenticated caller could POST an event into any
 * account. Callers must authorise first; today the only caller is
 * `provisionEventFromQuote`, which runs off an accepted quote.
 */
import "server-only";

import { revalidatePath } from "next/cache";

import { getServiceRoleClient } from "@/lib/supabase/service-role";
import {
  createEventSchema,
  type CreateEventInput,
} from "@/lib/validations/events";
import { expandTemplate } from "@/server/expand-template";
import type { ActionResult } from "@/types/actions";

/**
 * Create an event with the service role, optionally expanding a template.
 *
 * @returns the new event id, or a caller-safe error message.
 */
export async function createEventInternal(
  input: Omit<CreateEventInput, "pipedriveDealId">
): Promise<ActionResult<{ id: string }>> {
  const parsed = createEventSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input.",
    };
  }

  const supabase = getServiceRoleClient();
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
      current_stage: "confirmed",
      health_status: "green",
    })
    .select("id")
    .single();

  if (error || !data) {
    return { success: false, error: "Could not create event. Please try again." };
  }

  if (parsed.data.templateId) {
    await expandTemplate(data.id as string, parsed.data.templateId);
  }

  revalidatePath("/");
  revalidatePath("/pipeline");
  revalidatePath("/ops");
  return { success: true, data: { id: data.id as string } };
}
