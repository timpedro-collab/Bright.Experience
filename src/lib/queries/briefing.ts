/** Supabase read queries for briefing responses. */

import { createClient } from "@/lib/supabase/server";
import { logQueryError } from "@/lib/observability/log-query-error";

export type BriefingFormType = "creative" | "ops";

export interface BriefingResponseRow {
  event_id: string;
  form_type: BriefingFormType;
  responses: Record<string, unknown>;
  is_submitted: boolean;
  updated_at?: string;
}

/**
 * Fetch a single briefing response for an event + form type.
 * Returns null when no row exists.
 */
export async function getBriefingResponse(
  eventId: string,
  formType: BriefingFormType,
): Promise<BriefingResponseRow | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("briefing_responses")
    .select("event_id, form_type, responses, is_submitted, updated_at")
    .eq("event_id", eventId)
    .eq("form_type", formType)
    .maybeSingle();

  if (error || !data) {
    logQueryError("getBriefingResponse", error, { eventId });
    return null;
  }
  return data as BriefingResponseRow;
}

/**
 * Fetch creative and ops briefing responses for an event in parallel.
 */
export async function getBriefingResponsesForEvent(eventId: string): Promise<{
  creative: BriefingResponseRow | null;
  ops: BriefingResponseRow | null;
}> {
  const [creative, ops] = await Promise.all([
    getBriefingResponse(eventId, "creative"),
    getBriefingResponse(eventId, "ops"),
  ]);
  return { creative, ops };
}
