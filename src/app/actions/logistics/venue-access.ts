"use server";

/**
 * Venue access details — hall, stand number, loading zone, etc.
 *
 * Trade-show / exhibition specifics the customer knows and ops needs to reach
 * the right spot. Stored as one dedicated `logistics_entries` row
 * (`venue_access`) with the fields packed as JSON in `description`, so no
 * schema change is required and the small, free-form set stays together.
 */

import { createClient } from "@/lib/supabase/server";
import { getServiceRoleClient } from "@/lib/supabase/service-role";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/types/actions";

export interface VenueAccess {
  hall: string;
  stand: string;
  loadingZone: string;
  notes: string;
}

const VENUE_ACCESS = "venue_access";

function venueAccessHasContent(v: VenueAccess): boolean {
  return Boolean(
    v.hall.trim() || v.stand.trim() || v.loadingZone.trim() || v.notes.trim()
  );
}

export async function getVenueAccess(
  eventId: string
): Promise<VenueAccess | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("logistics_entries")
    .select("description")
    .eq("event_id", eventId)
    .eq("entry_type", VENUE_ACCESS)
    .maybeSingle();
  const raw = data?.description as string | null | undefined;
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<VenueAccess>;
    return {
      hall: parsed.hall ?? "",
      stand: parsed.stand ?? "",
      loadingZone: parsed.loadingZone ?? "",
      notes: parsed.notes ?? "",
    };
  } catch {
    return null;
  }
}

export async function saveVenueAccess(
  eventId: string,
  data: VenueAccess
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const { data: ev } = await supabase
    .from("events")
    .select("id")
    .eq("id", eventId)
    .maybeSingle();
  if (!ev) {
    return { success: false, error: "You don't have access to this event." };
  }

  const clean: VenueAccess = {
    hall: data.hall.trim(),
    stand: data.stand.trim(),
    loadingZone: data.loadingZone.trim(),
    notes: data.notes.trim(),
  };

  const admin = getServiceRoleClient();
  const { data: existing } = await admin
    .from("logistics_entries")
    .select("id")
    .eq("event_id", eventId)
    .eq("entry_type", VENUE_ACCESS)
    .maybeSingle();

  // Clearing every field removes the stored access details.
  if (!venueAccessHasContent(clean)) {
    if (existing) {
      await admin.from("logistics_entries").delete().eq("id", existing.id);
    }
    revalidatePath(`/events/${eventId}/logistics`);
    revalidatePath(`/events/${eventId}`);
    return { success: true, data: undefined };
  }

  const row = {
    event_id: eventId,
    entry_type: VENUE_ACCESS,
    title: "Venue access",
    description: JSON.stringify(clean),
    status: "requested",
    updated_at: new Date().toISOString(),
  };

  if (existing) {
    const { error } = await admin
      .from("logistics_entries")
      .update(row)
      .eq("id", existing.id);
    if (error) return { success: false, error: `Couldn't save: ${error.message}` };
  } else {
    const { error } = await admin
      .from("logistics_entries")
      .insert({ ...row, created_by: user.id, sort_order: -1 });
    if (error) return { success: false, error: `Couldn't save: ${error.message}` };
  }

  await supabase.from("audit_entries").insert({
    event_id: eventId,
    actor_id: user.id,
    action: "venue_access_saved",
    entity_type: "logistics_entry",
    metadata: { hall: clean.hall || undefined, stand: clean.stand || undefined },
  });

  revalidatePath(`/events/${eventId}/logistics`);
  revalidatePath(`/events/${eventId}`);
  return { success: true, data: undefined };
}
