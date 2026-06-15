/** Pipeline event query — all events with stage, health, account, owner for the kanban board. */
import { createClient } from "@/lib/supabase/server";
import type { Stage, HealthStatus } from "@/types";

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
export async function getPipelineEvents(search?: string): Promise<PipelineEvent[]> {
  const supabase = await createClient();
  let query = supabase
    .from("events")
    .select("id, name, current_stage, health_status, event_date_start, event_date_end, accounts(name), owner:profiles!events_created_by_fkey(id, name)")
    .order("event_date_start")
    .limit(200);

  if (search) {
    query = query.or(`name.ilike.%${search}%,accounts.name.ilike.%${search}%`);
  }

  const { data, error } = await query;
  if (error || !data) return [];

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
