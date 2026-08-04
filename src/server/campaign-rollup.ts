/**
 * Campaign metric roll-up — computes and persists aggregate_metrics_json,
 * the column the campaign dashboard has read since day one but nothing wrote.
 *
 * Called after campaign membership changes and by the reports cron, so it
 * uses the service-role client. Snapshots are cumulative per event: the
 * latest row per event is that event's total.
 */
import "server-only";

import { getServiceRoleClient } from "@/lib/supabase/service-role";
import { engagedMinutes } from "@/lib/metrics/engaged-minutes";

export interface CampaignAggregate {
  totalPlays: number;
  totalInteractions: number;
  totalLeads: number;
  totalPrizes: number;
  engagedMinutes: number | null;
  eventCount: number;
  updatedAt: string;
}

/**
 * Recompute one campaign's aggregate metrics and write them back.
 * Returns the aggregate, or null when the campaign has no member events
 * (in which case the column is reset so stale numbers can't linger).
 */
export async function refreshCampaignMetrics(
  campaignId: string,
): Promise<CampaignAggregate | null> {
  const supabase = getServiceRoleClient();

  const { data: members, error: membersError } = await supabase
    .from("campaign_events")
    .select("event_id")
    .eq("campaign_id", campaignId);

  if (membersError) {
    console.error("[campaign-rollup] member load failed:", membersError.message, {
      campaignId,
    });
    return null;
  }

  const eventIds = (members ?? []).map(
    (m: { event_id: string }) => m.event_id,
  );
  if (eventIds.length === 0) {
    await supabase
      .from("campaigns")
      .update({ aggregate_metrics_json: null })
      .eq("id", campaignId);
    return null;
  }

  const { data: snapshots, error: snapshotsError } = await supabase
    .from("event_metrics_snapshot")
    .select(
      "event_id, snapshot_date, total_plays, total_interactions, total_leads, total_prizes, avg_dwell_time",
    )
    .in("event_id", eventIds)
    .order("snapshot_date", { ascending: false });

  if (snapshotsError) {
    console.error(
      "[campaign-rollup] snapshot load failed:",
      snapshotsError.message,
      { campaignId },
    );
    return null;
  }

  // First row per event is its latest (cumulative) snapshot.
  const rows = snapshots ?? [];
  const latestByEvent = new Map<string, (typeof rows)[number]>();
  for (const row of rows) {
    if (!latestByEvent.has(row.event_id)) latestByEvent.set(row.event_id, row);
  }

  let plays = 0;
  let interactions = 0;
  let leads = 0;
  let prizes = 0;
  let dwellWeighted = 0;
  for (const snap of latestByEvent.values()) {
    plays += snap.total_plays ?? 0;
    interactions += snap.total_interactions ?? 0;
    leads += snap.total_leads ?? 0;
    prizes += snap.total_prizes ?? 0;
    dwellWeighted += (snap.avg_dwell_time ?? 0) * (snap.total_plays ?? 0);
  }
  const avgDwell = plays > 0 ? dwellWeighted / plays : null;

  const aggregate: CampaignAggregate = {
    totalPlays: plays,
    totalInteractions: interactions,
    totalLeads: leads,
    totalPrizes: prizes,
    engagedMinutes: engagedMinutes(plays, avgDwell),
    eventCount: eventIds.length,
    updatedAt: new Date().toISOString(),
  };

  const { error: writeError } = await supabase
    .from("campaigns")
    .update({ aggregate_metrics_json: aggregate })
    .eq("id", campaignId);

  if (writeError) {
    console.error("[campaign-rollup] write failed:", writeError.message, {
      campaignId,
    });
  }

  return aggregate;
}

/** Refresh every campaign that contains the given event (post-report hook). */
export async function refreshCampaignsForEvent(eventId: string): Promise<void> {
  const supabase = getServiceRoleClient();
  const { data } = await supabase
    .from("campaign_events")
    .select("campaign_id")
    .eq("event_id", eventId);

  const campaignIds = [
    ...new Set(
      ((data ?? []) as Array<{ campaign_id: string }>).map((r) => r.campaign_id),
    ),
  ];
  for (const id of campaignIds) {
    await refreshCampaignMetrics(id);
  }
}
