"use server";

/**
 * Server actions for organizer shows: sponsor inventory on a show's fleet,
 * the tokened pitch links that inventory is sold with, and per-unit
 * deployment details (zone + mission).
 *
 * Status transitions (reserve / confirm / complete / release) are shared with
 * the venue runway and live in `./venues.ts` — `requireVenueManagerForSlot`
 * resolves either scope, so a show slot authorizes through its organizer.
 */

import { revalidatePath } from "next/cache";

import {
  requireOrganizerForShow,
  requireVenueManagerForSlot,
} from "@/lib/auth/portal";
import {
  createShowSlotSchema,
  assignSlotMachineSchema,
  attachSlotCreativesSchema,
  shareSlotPitchSchema,
  revokeSlotPitchSchema,
  updateMachineDeploymentSchema,
} from "@/lib/validations/organizers";
import { PITCH_TOKEN_DEFAULT_DAYS, pitchTokenExpiry } from "@/lib/sponsor-pitch";
import type { MachineMission } from "@/types";

/**
 * Sell one machine at a show as a sponsor slot. Price arrives as whole
 * currency units from the form and is stored as integer minor units, matching
 * the venue runway.
 */
export async function createShowSlot(data: {
  eventId: string;
  machineInstanceId: string;
  sponsorName?: string;
  startDate: string;
  endDate: string;
  price?: number;
}) {
  const parsed = createShowSlotSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false as const, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { supabase } = await requireOrganizerForShow(data.eventId);

  // The machine must actually be deployed to this show; otherwise an
  // organizer could sell a unit standing at somebody else's event.
  const { data: machine } = await supabase
    .from("machine_instances")
    .select("id")
    .eq("id", data.machineInstanceId)
    .eq("current_event_id", data.eventId)
    .maybeSingle();
  if (!machine) {
    return { success: false as const, error: "That machine isn't deployed to this show." };
  }

  const { data: slot, error } = await supabase
    .from("sponsorship_slots")
    .insert({
      event_id: data.eventId,
      machine_instance_id: data.machineInstanceId,
      sponsor_name: data.sponsorName?.trim() || null,
      start_date: data.startDate,
      end_date: data.endDate,
      price: data.price != null ? Math.round(data.price * 100) : null,
      // Naming a sponsor is the organizer saying it's spoken for. Leaving the
      // name blank opens it for sale. Anything beyond that (confirm, complete,
      // release) goes through the shared status transitions in `./venues.ts`.
      status: data.sponsorName?.trim() ? "reserved" : "available",
    })
    .select("id")
    .single();

  if (error) return { success: false as const, error: "Failed to create sponsor slot" };

  revalidatePath("/organizers");
  return { success: true as const, data: { id: slot.id } };
}

/** Move a slot onto a different machine at the same show. */
export async function assignSlotMachine(slotId: string, machineInstanceId: string) {
  const parsed = assignSlotMachineSchema.safeParse({ slotId, machineInstanceId });
  if (!parsed.success) {
    return { success: false as const, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { supabase } = await requireVenueManagerForSlot(slotId);

  const { data: slot } = await supabase
    .from("sponsorship_slots")
    .select("event_id")
    .eq("id", slotId)
    .maybeSingle();
  if (!slot?.event_id) {
    return { success: false as const, error: "Only show slots can be moved between machines." };
  }

  const { data: machine } = await supabase
    .from("machine_instances")
    .select("id")
    .eq("id", machineInstanceId)
    .eq("current_event_id", slot.event_id)
    .maybeSingle();
  if (!machine) {
    return { success: false as const, error: "That machine isn't deployed to this show." };
  }

  const { error } = await supabase
    .from("sponsorship_slots")
    .update({ machine_instance_id: machineInstanceId })
    .eq("id", slotId);

  if (error) return { success: false as const, error: "Failed to move the slot" };

  revalidatePath("/organizers");
  return { success: true as const, data: { id: slotId } };
}

/**
 * Mint (or rotate) the pitch link for a slot.
 *
 * The token is an unguessable capability URL, so it always carries an expiry
 * and can be revoked. Calling this on a slot that already has a link rotates
 * it, which is how a leaked link is killed.
 */
export async function shareSlotPitch(slotId: string, expiresInDays?: number) {
  const parsed = shareSlotPitchSchema.safeParse({ slotId, expiresInDays });
  if (!parsed.success) {
    return { success: false as const, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { supabase } = await requireVenueManagerForSlot(slotId);

  const token = crypto.randomUUID();
  const { error } = await supabase
    .from("sponsorship_slots")
    .update({
      pitch_token: token,
      pitch_token_expires_at: pitchTokenExpiry(
        expiresInDays ?? PITCH_TOKEN_DEFAULT_DAYS
      ).toISOString(),
    })
    .eq("id", slotId);

  if (error) return { success: false as const, error: "Failed to create the pitch link" };

  revalidatePath("/organizers");
  revalidatePath(`/sponsor/${token}`);
  return { success: true as const, data: { token } };
}

/** Kill a pitch link immediately. Used when a link leaks or a deal closes. */
export async function revokeSlotPitch(slotId: string) {
  const parsed = revokeSlotPitchSchema.safeParse({ slotId });
  if (!parsed.success) {
    return { success: false as const, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { supabase } = await requireVenueManagerForSlot(slotId);

  const { data: existing } = await supabase
    .from("sponsorship_slots")
    .select("pitch_token")
    .eq("id", slotId)
    .maybeSingle();

  const { error } = await supabase
    .from("sponsorship_slots")
    .update({ pitch_token: null, pitch_token_expires_at: null })
    .eq("id", slotId);

  if (error) return { success: false as const, error: "Failed to revoke the pitch link" };

  revalidatePath("/organizers");
  if (existing?.pitch_token) revalidatePath(`/sponsor/${existing.pitch_token}`);
  return { success: true as const, data: { id: slotId } };
}

/**
 * Set the creative running on a sponsor's slot.
 *
 * Assets come from the show's own asset library, so the sponsor's artwork
 * travels through the same upload and review pipeline as everything else
 * rather than arriving as an email attachment on the day.
 *
 * The list replaces what was there: passing one fewer id detaches it.
 */
export async function attachSlotCreatives(slotId: string, assetIds: string[]) {
  const parsed = attachSlotCreativesSchema.safeParse({ slotId, assetIds });
  if (!parsed.success) {
    return { success: false as const, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { supabase } = await requireVenueManagerForSlot(slotId);

  const { data: slot } = await supabase
    .from("sponsorship_slots")
    .select("event_id")
    .eq("id", slotId)
    .maybeSingle();
  if (!slot?.event_id) {
    return { success: false as const, error: "Only show slots carry creative." };
  }

  // Every asset must belong to this show — otherwise a slot could point at
  // another client's artwork.
  if (assetIds.length > 0) {
    const { data: assets } = await supabase
      .from("assets")
      .select("id")
      .eq("event_id", slot.event_id)
      .in("id", assetIds);
    if ((assets?.length ?? 0) !== assetIds.length) {
      return { success: false as const, error: "That creative doesn't belong to this show." };
    }
  }

  const { error } = await supabase
    .from("sponsorship_slots")
    .update({ creative_asset_ids: assetIds })
    .eq("id", slotId);

  if (error) return { success: false as const, error: "Failed to attach the creative" };

  revalidatePath("/organizers");
  return { success: true as const, data: { id: slotId, count: assetIds.length } };
}

/**
 * Set where a machine stands and what it's there to do. Zone is free text
 * because organizers name their own halls; mission is constrained because
 * the machine stack branches on it.
 *
 * Written with the service-role client on purpose. `machine_instances` is our
 * hardware register and organizers hold read-only RLS on it — an UPDATE
 * policy would have to expose the whole row, including `current_event_id` and
 * `status`, because RLS cannot be scoped to named columns. Authorization
 * happens above (`requireOrganizerForShow`, which throws), the input is
 * validated, and the write below touches only the two deployment columns.
 */
export async function updateMachineDeployment(
  machineInstanceId: string,
  data: { zone?: string | null; mission?: MachineMission | null }
) {
  const parsed = updateMachineDeploymentSchema.safeParse({
    machineInstanceId,
    ...data,
  });
  if (!parsed.success) {
    return { success: false as const, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();

  const { data: machine } = await supabase
    .from("machine_instances")
    .select("current_event_id")
    .eq("id", machineInstanceId)
    .maybeSingle();
  if (!machine?.current_event_id) {
    return { success: false as const, error: "That machine isn't deployed to a show." };
  }

  // Authorize against the show, not the machine: whoever runs the event
  // decides where its units stand. Throws for anyone else.
  await requireOrganizerForShow(machine.current_event_id);

  const updates: Record<string, unknown> = {};
  if (data.zone !== undefined) updates.zone = data.zone?.trim() || null;
  if (data.mission !== undefined) updates.mission = data.mission ?? null;
  if (Object.keys(updates).length === 0) {
    return { success: true as const, data: { id: machineInstanceId } };
  }

  const { getServiceRoleClient } = await import("@/lib/supabase/service-role");
  const { data: updated, error } = await getServiceRoleClient()
    .from("machine_instances")
    .update(updates)
    .eq("id", machineInstanceId)
    .select("id")
    .maybeSingle();

  // A write that matched no row is a failure, not a silent no-op: without
  // this check a policy change could turn every save into a lie.
  if (error || !updated) {
    return { success: false as const, error: "Failed to update the machine" };
  }

  revalidatePath("/organizers");
  revalidatePath(`/events/${machine.current_event_id}/configuration`);
  return { success: true as const, data: { id: machineInstanceId } };
}
