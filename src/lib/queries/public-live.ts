/**
 * Public read model for token-gated live dashboard snapshots.
 *
 * Anonymous viewers hold an unguessable `live_share_token`; this module is the
 * only surface that resolves it. Marketing-safe aggregates only — lead counts,
 * never lead rows or PII.
 */
import { getServiceRoleClient } from "@/lib/supabase/service-role";
import { logQueryError } from "@/lib/observability/log-query-error";

export interface PublicLiveSnapshot {
  eventName: string;
  venueName: string | null;
  /** True when today falls within the event's start..end dates. */
  isLive: boolean;
  totals: {
    plays: number;
    interactions: number;
    leads: number;
    prizes: number;
  };
  avgDwellSeconds: number | null;
  /** Pass-through of `events.live_share_expires_at`. */
  expiresAt: string;
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isTodayWithinEvent(start: string, end: string | null): boolean {
  const today = new Date().toISOString().slice(0, 10);
  const startDate = start.slice(0, 10);
  const endDate = (end ?? start).slice(0, 10);
  return today >= startDate && today <= endDate;
}

/**
 * Resolve a live-share token to headline metrics, or null when the token is
 * invalid, expired, or unknown.
 */
export async function getPublicLiveSnapshot(
  token: string,
): Promise<PublicLiveSnapshot | null> {
  if (!UUID_RE.test(token)) return null;

  const supabase = getServiceRoleClient();

  const { data: event, error: eventError } = await supabase
    .from("events")
    .select(
      "id, name, venue_name, event_date_start, event_date_end, live_share_expires_at",
    )
    .eq("live_share_token", token)
    .maybeSingle();

  if (eventError) logQueryError("getPublicLiveSnapshot", eventError, { token });
  if (!event?.live_share_expires_at) return null;

  const expiresAt = String(event.live_share_expires_at);
  if (new Date(expiresAt).getTime() <= Date.now()) return null;

  const { data: snapshot, error: snapError } = await supabase
    .from("event_metrics_snapshot")
    .select(
      "total_plays, total_interactions, total_leads, total_prizes, avg_dwell_time",
    )
    .eq("event_id", event.id)
    .order("snapshot_date", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (snapError) logQueryError("getPublicLiveSnapshot", snapError, { token });

  return {
    eventName: String(event.name),
    venueName: event.venue_name ? String(event.venue_name) : null,
    isLive: isTodayWithinEvent(
      String(event.event_date_start),
      event.event_date_end ? String(event.event_date_end) : null,
    ),
    totals: {
      plays: Number(snapshot?.total_plays ?? 0),
      interactions: Number(snapshot?.total_interactions ?? 0),
      leads: Number(snapshot?.total_leads ?? 0),
      prizes: Number(snapshot?.total_prizes ?? 0),
    },
    avgDwellSeconds:
      snapshot?.avg_dwell_time != null
        ? Number(snapshot.avg_dwell_time)
        : null,
    expiresAt,
  };
}
