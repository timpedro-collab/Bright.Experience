/** Supabase queries for QA checklist items */

import { createClient } from "@/lib/supabase/server";
import type { QAItem, QACategory, QAItemStatus } from "@/types";
import { logQueryError } from "@/lib/observability/log-query-error";

function mapQAItem(row: Record<string, unknown>): QAItem {
  return {
    id: row.id as string,
    eventId: row.event_id as string,
    category: row.category as QACategory,
    title: row.title as string,
    description: (row.description as string | null) ?? undefined,
    status: row.status as QAItemStatus,
    testedBy: (row.tested_by as string | null) ?? undefined,
    testedAt: (row.tested_at as string | null) ?? undefined,
    failureReason: (row.failure_reason as string | null) ?? undefined,
    fixDescription: (row.fix_description as string | null) ?? undefined,
    fixedBy: (row.fixed_by as string | null) ?? undefined,
    fixedAt: (row.fixed_at as string | null) ?? undefined,
    evidenceUrl: (row.evidence_url as string | null) ?? undefined,
    sortOrder: (row.sort_order as number) ?? 0,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

/** Fetch QA items for an event ordered by sort_order */
export async function getQAItemsByEvent(eventId: string): Promise<QAItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("qa_items")
    .select("*")
    .eq("event_id", eventId)
    .order("sort_order");

  if (error || !data) {
    logQueryError("getQAItemsByEvent", error, { eventId });
    return [];
  }
  return data.map((row) => mapQAItem(row as Record<string, unknown>));
}
