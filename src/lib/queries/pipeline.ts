/** Pipeline event query — all events with stage, health, account, owner for the kanban board. */
import { createClient } from "@/lib/supabase/server";
import type { Stage, HealthStatus } from "@/types";
import { logQueryError } from "@/lib/observability/log-query-error";
import {
  anyOf,
  ilikeContains,
  inList,
  isEmptySearch,
} from "@/lib/queries/filters";
import { findAccountIdsByName } from "@/lib/queries/accounts";
import type { EventFilters } from "@/lib/queries/events";

export interface PipelineEvent {
  id: string;
  name: string;
  accountName: string;
  currentStage: Stage;
  healthStatus: HealthStatus;
  eventDateStart: string;
  eventDateEnd?: string;
  ownerName?: string;
  ownerId?: string;
}

/** Fetch non-cancelled events for the kanban pipeline view (capped at 200). */
export async function getPipelineEvents(
  filters?: EventFilters,
): Promise<PipelineEvent[]> {
  const supabase = await createClient();
  let query = supabase
    .from("events")
    .select("id, name, current_stage, health_status, event_date_start, event_date_end, accounts(name), owner:profiles!events_created_by_fkey(id, name)")
    .order("event_date_start")
    .limit(200);

  if (filters?.stage) query = query.eq("current_stage", filters.stage);
  if (filters?.health) query = query.eq("health_status", filters.health);
  if (filters?.account) {
    query = query.eq("accounts.name", filters.account);
  }

  // Event name OR customer name, resolved in two steps because PostgREST
  // cannot OR across the embedded accounts resource.
  const search = filters?.q;
  if (search && !isEmptySearch(search)) {
    const accountIds = await findAccountIdsByName(supabase, search);
    query = query.or(
      anyOf(
        ilikeContains("name", search),
        accountIds.length > 0 ? inList("account_id", accountIds) : ""
      )
    );
  }

  const { data, error } = await query;
  if (error || !data) {
    logQueryError("getPipelineEvents", error);
    return [];
  }

  return data.map((row: Record<string, unknown>) => {
    const account = row.accounts as Record<string, unknown> | null;
    const owner = row.owner as Record<string, unknown> | null;
    return {
      id: row.id as string,
      name: row.name as string,
      accountName: (account?.name as string) ?? "",
      currentStage: row.current_stage as Stage,
      healthStatus: row.health_status as HealthStatus,
      eventDateStart: row.event_date_start as string,
      eventDateEnd: row.event_date_end as string | undefined,
      ownerName: (owner?.name as string) ?? undefined,
      ownerId: (owner?.id as string) ?? undefined,
    };
  });
}
