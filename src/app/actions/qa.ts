"use server";

/** Server actions for QA checklist management */

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

/** Update a QA item status. Failed items require notes as failure_reason; fixed items set fix_description. */
export async function updateQAItem(
  itemId: string,
  status: string,
  notes?: string
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  if (status === "failed" && !notes) {
    throw new Error("Failure reason is required when marking as failed");
  }

  const updateData: Record<string, unknown> = { status };

  if (status === "failed") {
    updateData.failure_reason = notes;
  } else if (status === "fixed") {
    updateData.fix_description = notes;
  }

  if (notes) updateData.notes = notes;
  updateData.updated_by = user.id;
  updateData.updated_at = new Date().toISOString();

  const { data: item, error } = await supabase
    .from("qa_items")
    .update(updateData)
    .eq("id", itemId)
    .select("event_id")
    .single();

  if (error) throw new Error(`Failed to update QA item: ${error.message}`);

  await supabase.from("audit_entries").insert({
    event_id: item.event_id,
    actor_id: user.id,
    action: `qa_item_${status}`,
    entity_type: "qa_item",
    entity_id: itemId,
    metadata: { status, notes },
  });

  revalidatePath(`/events/${item.event_id}/qa`);
}

/** Add a new QA checklist item to an event (internal use only) */
export async function addQAItem(
  eventId: string,
  title: string,
  category: string,
  description?: string
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  if (!title.trim()) throw new Error("Title is required");

  const { data: lastItem } = await supabase
    .from("qa_items")
    .select("sort_order")
    .eq("event_id", eventId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .single();

  const nextSortOrder = (lastItem?.sort_order ?? 0) + 1;

  const { data: item, error } = await supabase
    .from("qa_items")
    .insert({
      event_id: eventId,
      title: title.trim(),
      category,
      description: description ?? null,
      status: "pending",
      sort_order: nextSortOrder,
      created_by: user.id,
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to add QA item: ${error.message}`);

  await supabase.from("audit_entries").insert({
    event_id: eventId,
    actor_id: user.id,
    action: "qa_item_created",
    entity_type: "qa_item",
    entity_id: item.id,
    metadata: { title, category },
  });

  revalidatePath(`/events/${eventId}/qa`);
}
