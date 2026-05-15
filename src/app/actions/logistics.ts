"use server";

/** Server actions for logistics management */

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

/** Update a logistics entry's status, notes, or completion timestamp */
export async function updateLogisticsEntry(
  entryId: string,
  data: { status?: string; notes?: string; completedAt?: string }
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const updateData: Record<string, unknown> = {};
  if (data.status) updateData.status = data.status;
  if (data.notes !== undefined) updateData.notes = data.notes;
  if (data.completedAt) updateData.completed_at = data.completedAt;
  updateData.updated_at = new Date().toISOString();

  const { data: entry, error } = await supabase
    .from("logistics_entries")
    .update(updateData)
    .eq("id", entryId)
    .select("event_id")
    .single();

  if (error) throw new Error(`Failed to update logistics entry: ${error.message}`);

  await supabase.from("audit_entries").insert({
    event_id: entry.event_id,
    actor_id: user.id,
    action: "logistics_entry_updated",
    entity_type: "logistics_entry",
    entity_id: entryId,
    metadata: { ...data },
  });

  revalidatePath(`/events/${entry.event_id}/logistics`);
}

/** Add a new logistics entry to an event (internal use only) */
export async function addLogisticsEntry(
  eventId: string,
  data: {
    entryType: string;
    title: string;
    scheduledDate?: string;
    description?: string;
  }
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  if (!data.title.trim()) throw new Error("Title is required");

  const { data: lastEntry } = await supabase
    .from("logistics_entries")
    .select("sort_order")
    .eq("event_id", eventId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .single();

  const nextSortOrder = (lastEntry?.sort_order ?? 0) + 1;

  const { data: entry, error } = await supabase
    .from("logistics_entries")
    .insert({
      event_id: eventId,
      entry_type: data.entryType,
      title: data.title.trim(),
      description: data.description ?? null,
      scheduled_date: data.scheduledDate ?? null,
      status: "pending",
      sort_order: nextSortOrder,
      created_by: user.id,
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to add logistics entry: ${error.message}`);

  await supabase.from("audit_entries").insert({
    event_id: eventId,
    actor_id: user.id,
    action: "logistics_entry_created",
    entity_type: "logistics_entry",
    entity_id: entry.id,
    metadata: { entry_type: data.entryType, title: data.title },
  });

  revalidatePath(`/events/${eventId}/logistics`);
}
