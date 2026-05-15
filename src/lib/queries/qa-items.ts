/** Supabase queries for QA checklist items */

import { createClient } from "@/lib/supabase/server";

/** Fetch QA items for an event ordered by sort_order */
export async function getQAItemsByEvent(eventId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("qa_items")
    .select("*")
    .eq("event_id", eventId)
    .order("sort_order");

  if (error || !data) return [];
  return data;
}

/** Return aggregated QA status counts for an event */
export async function getQAStats(
  eventId: string
): Promise<{ total: number; passed: number; failed: number; fixed: number; pending: number }> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("qa_items")
    .select("status")
    .eq("event_id", eventId);

  if (error || !data) {
    return { total: 0, passed: 0, failed: 0, fixed: 0, pending: 0 };
  }

  return {
    total: data.length,
    passed: data.filter((i) => i.status === "passed").length,
    failed: data.filter((i) => i.status === "failed").length,
    fixed: data.filter((i) => i.status === "fixed").length,
    pending: data.filter((i) => i.status === "pending").length,
  };
}
