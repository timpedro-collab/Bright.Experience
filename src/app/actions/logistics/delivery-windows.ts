"use server";

/**
 * Preferred delivery & pickup windows — the customer's requested timing.
 *
 * These are the customer's *wishes* (distinct from the confirmed
 * delivery/setup/collection entries ops schedules), stored as two dedicated
 * `logistics_entries` rows (`desired_delivery`, `desired_pickup`) so no schema
 * change is needed: preferred date → scheduled_date, time window →
 * scheduled_time, extra notes → notes. They're kept out of the
 * delivery/setup/collection groupings and surfaced in their own card.
 */

import { createClient } from "@/lib/supabase/server";
import { getServiceRoleClient } from "@/lib/supabase/service-role";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/types/actions";

export interface DeliveryWindow {
  date: string;
  window: string;
  notes: string;
}

export interface DeliveryWindows {
  delivery: DeliveryWindow | null;
  pickup: DeliveryWindow | null;
}

const DESIRED_DELIVERY = "desired_delivery";
const DESIRED_PICKUP = "desired_pickup";

function windowHasContent(w: DeliveryWindow): boolean {
  return Boolean(w.date.trim() || w.window.trim() || w.notes.trim());
}

export async function getDeliveryWindows(
  eventId: string
): Promise<DeliveryWindows> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("logistics_entries")
    .select("entry_type, scheduled_date, scheduled_time, notes")
    .eq("event_id", eventId)
    .in("entry_type", [DESIRED_DELIVERY, DESIRED_PICKUP]);

  const pick = (type: string): DeliveryWindow | null => {
    const row = data?.find((e) => e.entry_type === type);
    if (!row) return null;
    return {
      date: (row.scheduled_date as string | null) ?? "",
      window: (row.scheduled_time as string | null) ?? "",
      notes: (row.notes as string | null) ?? "",
    };
  };

  return { delivery: pick(DESIRED_DELIVERY), pickup: pick(DESIRED_PICKUP) };
}

export async function saveDeliveryWindows(
  eventId: string,
  data: { delivery: DeliveryWindow; pickup: DeliveryWindow }
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  // Authorise via the RLS-scoped client, then write with the service role
  // (logistics inserts are reserved for internal staff under RLS, but this is
  // a sanctioned customer action). Same pattern as saveOnsiteContact.
  const { data: ev } = await supabase
    .from("events")
    .select("id")
    .eq("id", eventId)
    .maybeSingle();
  if (!ev) {
    return { success: false, error: "You don't have access to this event." };
  }

  if (!windowHasContent(data.delivery) && !windowHasContent(data.pickup)) {
    return {
      success: false,
      error: "Add a preferred date or window for delivery or pickup.",
    };
  }

  const admin = getServiceRoleClient();

  const upsertWindow = async (
    type: string,
    title: string,
    w: DeliveryWindow
  ) => {
    const { data: existing } = await admin
      .from("logistics_entries")
      .select("id")
      .eq("event_id", eventId)
      .eq("entry_type", type)
      .maybeSingle();

    // An empty window clears any prior preference.
    if (!windowHasContent(w)) {
      if (existing) {
        await admin.from("logistics_entries").delete().eq("id", existing.id);
      }
      return;
    }

    const row = {
      event_id: eventId,
      entry_type: type,
      title,
      scheduled_date: w.date.trim() || null,
      scheduled_time: w.window.trim() || null,
      notes: w.notes.trim() || null,
      status: "requested",
      updated_at: new Date().toISOString(),
    };

    if (existing) {
      await admin.from("logistics_entries").update(row).eq("id", existing.id);
    } else {
      await admin
        .from("logistics_entries")
        .insert({ ...row, created_by: user.id, sort_order: -1 });
    }
  };

  await upsertWindow(DESIRED_DELIVERY, "Preferred delivery window", data.delivery);
  await upsertWindow(DESIRED_PICKUP, "Preferred pickup window", data.pickup);

  await supabase.from("audit_entries").insert({
    event_id: eventId,
    actor_id: user.id,
    action: "delivery_windows_saved",
    entity_type: "logistics_entry",
    metadata: {
      delivery: windowHasContent(data.delivery),
      pickup: windowHasContent(data.pickup),
    },
  });

  revalidatePath(`/events/${eventId}/logistics`);
  revalidatePath(`/events/${eventId}`);
  return { success: true, data: undefined };
}
