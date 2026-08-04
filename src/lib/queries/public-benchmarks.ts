/**
 * Read model for the public Bright Index pages (/bright-index, /state-of-play).
 *
 * Uses the standard RLS client: the `benchmarks` table is world-readable by
 * policy ("Customers read benchmarks" … using (true)) and contains only
 * cross-event aggregates — no event, client, or personal data. The publication
 * sample floor is applied here as well as in the shaping layer so an
 * accidentally thin row never even leaves the database.
 */
import { createClient } from "@/lib/supabase/server";
import { logQueryError } from "@/lib/observability/log-query-error";
import {
  MIN_PUBLISHABLE_SAMPLE,
  type PublicBenchmarkRow,
} from "@/lib/bright-index/shape";

/** Fetch every benchmark row that clears the public sample floor. */
export async function getPublicBenchmarks(): Promise<PublicBenchmarkRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("benchmarks")
    .select(
      "event_type, location_tier, machine_type, metric_name, median_value, p25_value, p75_value, sample_size, updated_at"
    )
    .gte("sample_size", MIN_PUBLISHABLE_SAMPLE)
    .order("event_type")
    .order("metric_name");

  if (error || !data) {
    logQueryError("getPublicBenchmarks", error);
    return [];
  }

  return data.map((row: Record<string, unknown>) => ({
    eventType: row.event_type as string,
    locationTier: (row.location_tier as string | null) ?? null,
    machineType: (row.machine_type as string | null) ?? null,
    metricName: row.metric_name as string,
    medianValue: (row.median_value as number | null) ?? null,
    p25Value: (row.p25_value as number | null) ?? null,
    p75Value: (row.p75_value as number | null) ?? null,
    sampleSize: (row.sample_size as number) ?? 0,
    updatedAt: row.updated_at as string,
  }));
}
