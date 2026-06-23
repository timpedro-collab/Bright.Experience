/** Cross-event aggregate metrics for KPI dashboards. */
import { createClient } from "@/lib/supabase/server";

export interface AggregateMetrics {
  totalPlays: number;
  totalLeads: number;
  totalEvents: number;
  avgCostPerLead: number | null;
  totalInteractions: number;
}

/**
 * Sum telemetry metrics across all events for a given account within
 * the specified date range. Pulls from `event_metrics_snapshot`.
 */
export async function getAggregateMetrics(
  accountId: string,
  startDate: string,
  endDate: string,
): Promise<AggregateMetrics> {
  const supabase = await createClient();

  const { data: events } = await supabase
    .from("events")
    .select("id")
    .eq("account_id", accountId)
    .gte("event_date_start", startDate)
    .lte("event_date_start", endDate);

  const eventIds = (events ?? []).map((e) => e.id as string);
  const totalEvents = eventIds.length;

  if (totalEvents === 0) {
    return { totalPlays: 0, totalLeads: 0, totalEvents: 0, avgCostPerLead: null, totalInteractions: 0 };
  }

  const { data: snapshots } = await supabase
    .from("event_metrics_snapshot")
    .select("event_id, snapshot_date, total_plays, total_leads, total_interactions")
    .in("event_id", eventIds);

  // Snapshots are CUMULATIVE running totals (each day ≥ the prior), so summing
  // every row would multiply-count an event's totals. Keep only the latest
  // snapshot per event (its current event-to-date total), then sum across
  // events for the account-wide aggregate.
  const latestByEvent = new Map<
    string,
    { date: string; plays: number; leads: number; interactions: number }
  >();
  for (const s of snapshots ?? []) {
    const eventId = s.event_id as string;
    const date = (s.snapshot_date as string) ?? "";
    const existing = latestByEvent.get(eventId);
    if (!existing || date >= existing.date) {
      latestByEvent.set(eventId, {
        date,
        plays: (s.total_plays as number) ?? 0,
        leads: (s.total_leads as number) ?? 0,
        interactions: (s.total_interactions as number) ?? 0,
      });
    }
  }

  let totalPlays = 0;
  let totalLeads = 0;
  let totalInteractions = 0;

  for (const s of latestByEvent.values()) {
    totalPlays += s.plays;
    totalLeads += s.leads;
    totalInteractions += s.interactions;
  }

  return {
    totalPlays,
    totalLeads,
    totalEvents,
    avgCostPerLead: null,
    totalInteractions,
  };
}
