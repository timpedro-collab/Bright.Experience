"use server";

/**
 * Server actions for handoff notes during stage transitions.
 */

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/types/actions";

export interface HandoffNote {
  id: string;
  eventId: string;
  fromStage: string;
  toStage: string;
  authorId: string;
  authorName?: string;
  whatsDone: string | null;
  whatsPending: string | null;
  clientNotes: string | null;
  createdAt: string;
}

function mapNote(row: Record<string, unknown>): HandoffNote {
  const author = row.profiles as Record<string, unknown> | null;
  return {
    id: row.id as string,
    eventId: row.event_id as string,
    fromStage: row.from_stage as string,
    toStage: row.to_stage as string,
    authorId: row.author_id as string,
    authorName: (author?.name as string) ?? undefined,
    whatsDone: (row.whats_done as string | null) ?? null,
    whatsPending: (row.whats_pending as string | null) ?? null,
    clientNotes: (row.client_notes as string | null) ?? null,
    createdAt: row.created_at as string,
  };
}

export async function getHandoffNotes(eventId: string): Promise<HandoffNote[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("handoff_notes")
    .select("*, profiles!handoff_notes_author_id_fkey(name)")
    .eq("event_id", eventId)
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return data.map((row) => mapNote(row as Record<string, unknown>));
}

export async function createHandoffNote(
  eventId: string,
  fromStage: string,
  toStage: string,
  content: {
    whatsDone?: string;
    whatsPending?: string;
    clientNotes?: string;
  }
): Promise<ActionResult<{ id: string }>> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const { data, error } = await supabase
    .from("handoff_notes")
    .insert({
      event_id: eventId,
      from_stage: fromStage,
      to_stage: toStage,
      author_id: user.id,
      whats_done: content.whatsDone ?? null,
      whats_pending: content.whatsPending ?? null,
      client_notes: content.clientNotes ?? null,
    })
    .select("id")
    .single();

  if (error) return { success: false, error: `Failed to create handoff note: ${error.message}` };
  revalidatePath(`/events/${eventId}`);
  return { success: true, data: { id: data.id } };
}
