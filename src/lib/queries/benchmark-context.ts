/** Loads prior-event and venue-class benchmark context for one event report. */
import { createClient } from "@/lib/supabase/server";
import {
  compareToLastEvent,
  compareToVenueClass,
  type BenchmarkVerdict,
} from "@/lib/metrics/benchmark-compare";
import { showDayCount } from "@/lib/metrics/expected-performance";
import { getBenchmarkForComparison } from "@/lib/queries/benchmarks";
import { logQueryError, type QueryErrorLike } from "@/lib/observability/log-query-error";

export interface BenchmarkContext {
  lastEvent: { verdicts: BenchmarkVerdict[]; eventName: string } | null;
  venueClass: { verdicts: BenchmarkVerdict[]; sampleSize: number } | null;
}

type SnapshotTotals = {
  plays: number;
  leads: number;
  dwellSeconds: number;
};

/** Keep the latest cumulative snapshot row per event. */
function latestSnapshotByEvent(
  rows: Array<Record<string, unknown>>,
): Map<string, SnapshotTotals> {
  const latest = new Map<string, { date: string; totals: SnapshotTotals }>();

  for (const row of rows) {
    const eventId = row.event_id as string;
    const date = (row.snapshot_date as string) ?? "";
    const totals: SnapshotTotals = {
      plays: Number(row.total_plays ?? 0),
      leads: Number(row.total_leads ?? 0),
      dwellSeconds: Number(row.avg_dwell_time ?? 0),
    };
    const existing = latest.get(eventId);
    if (!existing || date >= existing.date) {
      latest.set(eventId, { date, totals });
    }
  }

  return new Map(
    [...latest.entries()].map(([eventId, { totals }]) => [eventId, totals]),
  );
}

function medianFromBenchmarks(
  rows: Awaited<ReturnType<typeof getBenchmarkForComparison>>,
  metricName: string,
): number | null {
  const match = rows.find((row) => row.metricName === metricName);
  if (match?.medianValue == null || !Number.isFinite(match.medianValue)) {
    return null;
  }
  return match.medianValue;
}

function maxSampleSize(
  rows: Awaited<ReturnType<typeof getBenchmarkForComparison>>,
  metricNames: string[],
): number {
  return rows
    .filter((row) => metricNames.includes(row.metricName))
    .reduce((max, row) => Math.max(max, row.sampleSize ?? 0), 0);
}

/** Compare one event against its account's prior show and venue-class medians. */
export async function getBenchmarkContext(
  eventId: string,
): Promise<BenchmarkContext> {
  const empty: BenchmarkContext = { lastEvent: null, venueClass: null };

  try {
    const supabase = await createClient();

    const { data: event, error: eventError } = await supabase
      .from("events")
      .select(
        "id, account_id, event_type, machine_type, event_date_start, event_date_end, name",
      )
      .eq("id", eventId)
      .single();

    if (eventError || !event) {
      logQueryError("getBenchmarkContext", eventError, { eventId });
      return empty;
    }

    const accountId = event.account_id as string;
    const { data: priorEvents, error: priorError } = await supabase
      .from("events")
      .select("id, name, event_date_start, event_date_end")
      .eq("account_id", accountId)
      .eq("current_stage", "complete")
      .neq("id", eventId)
      .order("event_date_start", { ascending: false });

    if (priorError) {
      logQueryError("getBenchmarkContext", priorError, { eventId, accountId });
      return empty;
    }

    const snapshotEventIds = [
      eventId,
      ...(priorEvents ?? []).map((row) => row.id as string),
    ];

    const { data: snapshots, error: snapshotError } = await supabase
      .from("event_metrics_snapshot")
      .select(
        "event_id, snapshot_date, total_plays, total_leads, avg_dwell_time",
      )
      .in("event_id", snapshotEventIds);

    if (snapshotError) {
      logQueryError("getBenchmarkContext", snapshotError, { eventId });
      return empty;
    }

    const latestByEvent = latestSnapshotByEvent(snapshots ?? []);
    const currentSnapshot = latestByEvent.get(eventId);
    if (!currentSnapshot) return empty;

    const currentDays = showDayCount(
      String(event.event_date_start),
      event.event_date_end ? String(event.event_date_end) : null,
    );

    let lastEvent: BenchmarkContext["lastEvent"] = null;
    for (const prior of priorEvents ?? []) {
      const priorSnapshot = latestByEvent.get(prior.id as string);
      if (!priorSnapshot) continue;

      const verdicts = compareToLastEvent(currentSnapshot, priorSnapshot);
      if (verdicts.length === 0) continue;

      lastEvent = {
        verdicts,
        eventName: String(prior.name),
      };
      break;
    }

    const benchmarks = await getBenchmarkForComparison(
      String(event.event_type),
      event.machine_type ? String(event.machine_type) : undefined,
    );

    const playsMedian = medianFromBenchmarks(benchmarks, "plays_per_day");
    const leadsMedian = medianFromBenchmarks(benchmarks, "leads_per_day");
    const venueVerdicts = compareToVenueClass(
      {
        playsPerDay: currentSnapshot.plays / currentDays,
        leadsPerDay: currentSnapshot.leads / currentDays,
      },
      { playsPerDay: playsMedian, leadsPerDay: leadsMedian },
    );

    const venueClass =
      venueVerdicts.length > 0
        ? {
            verdicts: venueVerdicts,
            sampleSize: maxSampleSize(benchmarks, [
              "plays_per_day",
              "leads_per_day",
            ]),
          }
        : null;

    return { lastEvent, venueClass };
  } catch (error: unknown) {
    logQueryError("getBenchmarkContext", error as QueryErrorLike, { eventId });
    return empty;
  }
}
