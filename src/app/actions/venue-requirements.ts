"use server";

/**
 * Server actions for venue requirements tracking.
 */

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/types/actions";
import {
  REQUIREMENT_TYPE_LABELS,
  type VenueRequirementType,
  type VenueRequirement,
} from "@/types/venue-requirements";

function mapRequirement(row: Record<string, unknown>): VenueRequirement {
  return {
    id: row.id as string,
    eventId: row.event_id as string,
    requirementType: row.requirement_type as VenueRequirementType,
    description: row.description as string,
    documentUrl: (row.document_url as string | null) ?? null,
    isMet: Boolean(row.is_met),
    notes: (row.notes as string | null) ?? null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

export async function getVenueRequirements(eventId: string): Promise<VenueRequirement[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("venue_requirements")
    .select("*")
    .eq("event_id", eventId)
    .order("created_at");
  if (error || !data) return [];
  return data.map((row) => mapRequirement(row as Record<string, unknown>));
}

export async function addVenueRequirement(
  eventId: string,
  requirementType: VenueRequirementType,
  description: string,
  notes?: string
): Promise<ActionResult<{ id: string }>> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const { data, error } = await supabase
    .from("venue_requirements")
    .insert({
      event_id: eventId,
      requirement_type: requirementType,
      description,
      notes: notes ?? null,
    })
    .select("id")
    .single();

  if (error) return { success: false, error: `Failed to add requirement: ${error.message}` };
  revalidatePath(`/events/${eventId}/logistics`);
  return { success: true, data: { id: data.id } };
}

export async function toggleVenueRequirement(
  requirementId: string,
  eventId: string,
  isMet: boolean
): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("venue_requirements")
    .update({ is_met: isMet, updated_at: new Date().toISOString() })
    .eq("id", requirementId);
  if (error) return { success: false, error: `Update failed: ${error.message}` };
  revalidatePath(`/events/${eventId}/logistics`);
  return { success: true, data: undefined };
}
