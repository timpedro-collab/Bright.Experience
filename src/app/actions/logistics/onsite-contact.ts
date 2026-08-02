"use server";

/**
 * Onsite contact — the customer's "Provide onsite contact details" task.
 *
 * Stored as a single dedicated `logistics_entries` row (entry_type
 * `onsite_contact`) so it lives with the rest of the day's logistics without
 * a schema change: name → contact_name, phone → contact_phone, email →
 * description, extra notes → notes. It is deliberately kept out of the
 * delivery/setup/collection groupings and surfaced in its own card.
 */

import { createClient } from "@/lib/supabase/server";
import { getServiceRoleClient } from "@/lib/supabase/service-role";
import { revalidatePath } from "next/cache";
import { autoCompleteTaskByPath } from "@/server/tasks";
import type { ActionResult } from "@/types/actions";

export interface OnsiteContact {
  name: string;
  phone: string;
  email: string;
  notes: string;
}

export async function getOnsiteContact(
  eventId: string
): Promise<OnsiteContact | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("logistics_entries")
    .select("contact_name, contact_phone, description, notes")
    .eq("event_id", eventId)
    .eq("entry_type", "onsite_contact")
    .maybeSingle();
  if (!data) return null;
  return {
    name: (data.contact_name as string | null) ?? "",
    phone: (data.contact_phone as string | null) ?? "",
    email: (data.description as string | null) ?? "",
    notes: (data.notes as string | null) ?? "",
  };
}

export async function saveOnsiteContact(
  eventId: string,
  data: { name: string; phone: string; email: string; notes: string }
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  // Authorise via the RLS-scoped client: if the caller can read the event,
  // they're a member of it and may record its onsite contact. We then write
  // with the service role because RLS reserves logistics inserts for internal
  // staff, and this is a sanctioned customer action.
  const { data: ev } = await supabase
    .from("events")
    .select("id")
    .eq("id", eventId)
    .maybeSingle();
  if (!ev) {
    return { success: false, error: "You don't have access to this event." };
  }

  const name = data.name.trim();
  const phone = data.phone.trim();
  const email = data.email.trim();
  if (!name || (!phone && !email)) {
    return {
      success: false,
      error: "Add the contact's name and at least a phone or email.",
    };
  }

  const admin = getServiceRoleClient();
  const { data: existing } = await admin
    .from("logistics_entries")
    .select("id")
    .eq("event_id", eventId)
    .eq("entry_type", "onsite_contact")
    .maybeSingle();

  const row = {
    event_id: eventId,
    entry_type: "onsite_contact",
    title: "Onsite contact",
    contact_name: name,
    contact_phone: phone || null,
    description: email || null,
    notes: data.notes.trim() || null,
    status: "confirmed",
    updated_at: new Date().toISOString(),
  };

  let entryId = existing?.id as string | undefined;
  if (entryId) {
    const { error } = await admin
      .from("logistics_entries")
      .update(row)
      .eq("id", entryId);
    if (error) {
      return { success: false, error: `Couldn't save: ${error.message}` };
    }
  } else {
    const { data: inserted, error } = await admin
      .from("logistics_entries")
      .insert({ ...row, created_by: user.id, sort_order: -1 })
      .select("id")
      .single();
    if (error || !inserted) {
      return {
        success: false,
        error: `Couldn't save: ${error?.message ?? "unknown error"}`,
      };
    }
    entryId = inserted.id as string;
  }

  await supabase.from("audit_entries").insert({
    event_id: eventId,
    actor_id: user.id,
    action: "onsite_contact_saved",
    entity_type: "logistics_entry",
    entity_id: entryId,
    metadata: { name },
  });

  // Submitting the contact fulfils the customer's onsite-contact task.
  await autoCompleteTaskByPath(eventId, "logistics");

  revalidatePath(`/events/${eventId}/logistics`);
  revalidatePath(`/events/${eventId}`);
  revalidatePath(`/events/${eventId}/actions`);
  return { success: true, data: undefined };
}
