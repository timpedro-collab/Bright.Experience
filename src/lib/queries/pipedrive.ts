/** Supabase read queries for Pipedrive admin config + outbox (service role). */

import { getServiceRoleClient } from "@/lib/supabase/service-role";
import { logQueryError } from "@/lib/observability/log-query-error";

export interface PipedriveConfigRow {
  api_token: string | null;
  base_url: string;
  field_key_last_activity_at: string | null;
  field_key_health_status: string | null;
  field_key_delivered_events: string | null;
  health_option_green_id: number | null;
  health_option_amber_id: number | null;
  health_option_red_id: number | null;
  default_pipeline_id: number | null;
  updated_at: string | null;
}

export interface PipedriveOutboxEntry {
  id: string;
  eventId: string | null;
  dealId: string | null;
  kind: string;
  attempts: number;
  lastError: string | null;
  sentAt: string | null;
  createdAt: string;
  title: string | null;
}

/** Singleton Pipedrive config row (id = 1), or null when unset. */
export async function getPipedriveConfig(): Promise<PipedriveConfigRow | null> {
  const supabase = getServiceRoleClient();
  const { data, error } = await supabase
    .from("pipedrive_config")
    .select("*")
    .eq("id", 1)
    .maybeSingle();

  if (error || !data) {
    logQueryError("getPipedriveConfig", error);
    return null;
  }
  return data as PipedriveConfigRow;
}

/** Recent outbox rows for the admin monitor (newest first). */
export async function getPipedriveOutboxTail(
  limit = 20,
): Promise<PipedriveOutboxEntry[]> {
  const supabase = getServiceRoleClient();
  const { data, error } = await supabase
    .from("pipedrive_outbox")
    .select(
      "id, event_id, deal_id, kind, attempts, last_error, sent_at, created_at, payload",
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data) {
    logQueryError("getPipedriveOutboxTail", error);
    return [];
  }
  return (data as Array<Record<string, unknown>>).map((row) => ({
    id: String(row.id),
    eventId: (row.event_id as string) ?? null,
    dealId: (row.deal_id as string) ?? null,
    kind: String(row.kind),
    attempts: Number(row.attempts ?? 0),
    lastError: (row.last_error as string) ?? null,
    sentAt: (row.sent_at as string) ?? null,
    createdAt: String(row.created_at),
    title: (row.payload as { title?: string } | null)?.title ?? null,
  }));
}
