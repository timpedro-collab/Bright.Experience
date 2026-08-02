/** Audit trail queries — paginated + preview for event activity feed. */
import { createClient } from "@/lib/supabase/server";
import { PAGE_SIZE, paginateQuery, totalPages } from "@/lib/pagination";
import type { AuditEntry } from "@/types";
import { logQueryError } from "@/lib/observability/log-query-error";

interface AuditRow extends AuditEntry {
  actorName?: string;
}

function mapRow(row: Record<string, unknown>): AuditRow {
  const profile = row.profiles as Record<string, unknown> | null;
  return {
    id: row.id as string,
    eventId: row.event_id as string,
    actorId: (row.actor_id as string) ?? undefined,
    action: row.action as string,
    entityType: row.entity_type as string,
    entityId: row.entity_id as string,
    metadata: (row.metadata as Record<string, unknown>) ?? {},
    createdAt: row.created_at as string,
    actorName: (profile?.name as string) ?? undefined,
  };
}

/** Paginated audit entries for the full activity log. */
export async function getAuditEntriesForEvent(
  eventId: string,
  page: number = 1,
  pageSize: number = PAGE_SIZE,
): Promise<{ data: AuditRow[]; totalCount: number; totalPages: number }> {
  const supabase = await createClient();
  const query = supabase
    .from("audit_entries")
    .select("*, profiles!audit_entries_actor_id_fkey(name)", { count: "exact" })
    .eq("event_id", eventId)
    .order("created_at", { ascending: false });

  const { data, error, count } = await paginateQuery(query, page, pageSize);
  if (error || !data) {
    logQueryError("getAuditEntriesForEvent", error, { eventId });
    return { data: [], totalCount: 0, totalPages: 1 };
  }

  const total = count ?? 0;
  return { data: data.map(mapRow), totalCount: total, totalPages: totalPages(total, pageSize) };
}

/** Recent audit entries for the overview preview. */
export async function getRecentAuditEntries(
  eventId: string,
  limit: number = 5,
): Promise<AuditRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("audit_entries")
    .select("*, profiles!audit_entries_actor_id_fkey(name)")
    .eq("event_id", eventId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data) {
    logQueryError("getRecentAuditEntries", error, { eventId });
    return [];
  }
  return data.map(mapRow);
}

export type { AuditRow };
