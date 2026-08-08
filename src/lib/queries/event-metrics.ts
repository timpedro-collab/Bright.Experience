/**
 * Supabase read queries for aggregated event metrics snapshots.
 *
 * `event_metrics_snapshot` rows are PER-DAY figures (the webhook counts each
 * day's telemetry into its own `snapshot_date` row). Event totals are
 * therefore the SUM across rows — the same arithmetic report generation uses
 * — never the latest row alone, which on a multi-day event is just the final
 * day and silently disagrees with the report and the leads list.
 */
import { createClient } from "@/lib/supabase/server";
import { logQueryError } from "@/lib/observability/log-query-error";
/** Event-to-date totals summed across every daily snapshot. */
export interface EventMetricTotals {
  totalPlays: number;
  totalLeads: number;
  totalInteractions: number;
  totalPrizes: number;
  /** Mean of the daily averages — close enough for a headline tile. */
  avgDwellTime: number;
  /** Stock reads come from the latest day only; they are levels, not flows. */
  stockRemaining: number | null;
  stockCapacity: number | null;
  peakHour: number | null;
  snapshotCount: number;
}

/**
 * Sum an event's daily snapshots into one set of event-to-date totals — the
 * single number the Live tab, the Leads header, and the report all agree on.
 * Returns null when the event has no snapshots yet (normal pre-show state).
 */
export async function getEventMetricTotals(
  eventId: string,
): Promise<EventMetricTotals | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("event_metrics_snapshot")
    .select(
      "snapshot_date, total_plays, total_interactions, total_leads, total_prizes, avg_dwell_time, peak_hour, stock_remaining, stock_capacity"
    )
    .eq("event_id", eventId)
    .order("snapshot_date", { ascending: true });

  if (error || !data || data.length === 0) {
    if (error) logQueryError("getEventMetricTotals", error, { eventId });
    return null;
  }

  const totals: EventMetricTotals = {
    totalPlays: 0,
    totalLeads: 0,
    totalInteractions: 0,
    totalPrizes: 0,
    avgDwellTime: 0,
    stockRemaining: null,
    stockCapacity: null,
    peakHour: null,
    snapshotCount: data.length,
  };
  let dwellSum = 0;
  let dwellDays = 0;
  for (const row of data) {
    totals.totalPlays += Number(row.total_plays ?? 0);
    totals.totalLeads += Number(row.total_leads ?? 0);
    totals.totalInteractions += Number(row.total_interactions ?? 0);
    totals.totalPrizes += Number(row.total_prizes ?? 0);
    if (row.avg_dwell_time != null) {
      dwellSum += Number(row.avg_dwell_time);
      dwellDays++;
    }
  }
  totals.avgDwellTime = dwellDays > 0 ? dwellSum / dwellDays : 0;

  const latest = data[data.length - 1];
  totals.stockRemaining =
    latest.stock_remaining != null ? Number(latest.stock_remaining) : null;
  totals.stockCapacity =
    latest.stock_capacity != null ? Number(latest.stock_capacity) : null;
  totals.peakHour = latest.peak_hour != null ? Number(latest.peak_hour) : null;

  return totals;
}

export interface EventMetricsSummary {
  totalPlays: number;
  totalLeads: number;
}

/**
 * Event-to-date totals for a set of events, keyed by event id — the
 * side-by-side comparison read for campaign dashboards. Daily snapshot rows
 * are summed per event (they are per-day figures, not running totals).
 * Events with no snapshot are simply absent from the map.
 */
export async function getLatestMetricsForEvents(
  eventIds: string[],
): Promise<Map<string, EventMetricsSummary>> {
  const summaries = new Map<string, EventMetricsSummary>();
  if (eventIds.length === 0) return summaries;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("event_metrics_snapshot")
    .select("event_id, snapshot_date, total_plays, total_leads")
    .in("event_id", eventIds)
    .order("snapshot_date", { ascending: false })
    .limit(1000);

  if (error) {
    logQueryError("getLatestMetricsForEvents", error, {
      eventCount: eventIds.length,
    });
    return summaries;
  }

  for (const row of data ?? []) {
    const prior = summaries.get(row.event_id);
    if (prior) {
      prior.totalPlays += row.total_plays ?? 0;
      prior.totalLeads += row.total_leads ?? 0;
    } else {
      summaries.set(row.event_id, {
        totalPlays: row.total_plays ?? 0,
        totalLeads: row.total_leads ?? 0,
      });
    }
  }
  return summaries;
}
