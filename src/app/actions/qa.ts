"use server";

/**
 * Server actions for QA checklist management.
 *
 * QA items gate the `qa_readiness` stage — every item must reach
 * `passed` or `na` before the event can advance.
 */

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { updateQAItemSchema, addQAItemSchema } from "@/lib/validations/qa";
import { autoCompleteTaskByPath } from "@/app/actions/tasks";
import { bumpStreak } from "./streak";
import type { ActionResult } from "@/types/actions";

/** Update a QA item status. Failed items require notes as failure_reason; fixed items set fix_description. */
export async function updateQAItem(
  itemId: string,
  status: string,
  notes?: string
): Promise<ActionResult> {
  const parsed = updateQAItemSchema.safeParse({ itemId, status, notes });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const now = new Date().toISOString();
  const updateData: Record<string, unknown> = { status, updated_at: now };

  if (status === "failed") {
    updateData.failure_reason = notes;
  } else if (status === "fixed") {
    updateData.fix_description = notes;
    updateData.fixed_by = user.id;
    updateData.fixed_at = now;
  } else if (status === "passed") {
    updateData.tested_by = user.id;
    updateData.tested_at = now;
  }

  const { data: item, error } = await supabase
    .from("qa_items")
    .update(updateData)
    .eq("id", itemId)
    .select("event_id")
    .single();

  if (error) return { success: false, error: `Failed to update QA item: ${error.message}` };

  await supabase.from("audit_entries").insert({
    event_id: item.event_id,
    actor_id: user.id,
    action: `qa_item_${status}`,
    entity_type: "qa_item",
    entity_id: itemId,
    metadata: { status, notes },
  });

  if (status === "passed" || status === "fixed") {
    bumpStreak().catch(() => {});
  }

  if (status === "passed" || status === "fixed" || status === "na") {
    const { data: outstanding } = await supabase
      .from("qa_items")
      .select("id")
      .eq("event_id", item.event_id)
      .not("status", "in", '("passed","fixed","na")')
      .limit(1);

    if (!outstanding || outstanding.length === 0) {
      await autoCompleteTaskByPath(item.event_id, "qa");
    }
  }

  revalidatePath(`/events/${item.event_id}/qa`);
  return { success: true, data: undefined };
}

/** Add a new QA checklist item to an event (internal use only). */
export async function addQAItem(
  eventId: string,
  title: string,
  category: string,
  description?: string
): Promise<ActionResult<{ id: string }>> {
  const parsed = addQAItemSchema.safeParse({ eventId, title, category, description });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

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

  if (error) return { success: false, error: `Failed to add QA item: ${error.message}` };

  await supabase.from("audit_entries").insert({
    event_id: eventId,
    actor_id: user.id,
    action: "qa_item_created",
    entity_type: "qa_item",
    entity_id: item.id,
    metadata: { title, category },
  });

  revalidatePath(`/events/${eventId}/qa`);
  return { success: true, data: { id: item.id } };
}
