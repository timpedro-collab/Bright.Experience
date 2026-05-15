/** Supabase read queries for performance benchmarks. */
import { createClient } from "@/lib/supabase/server";
import type { Benchmark } from "@/types";

/** Map a database row to a camelCase Benchmark. */
function mapBenchmark(row: Record<string, unknown>): Benchmark {
  return {
    id: row.id as string,
    eventType: row.event_type as string,
    locationTier: row.location_tier as string | undefined,
    machineType: row.machine_type as string | undefined,
    gameType: row.game_type as string | undefined,
    metricName: row.metric_name as string,
    avgValue: row.avg_value as number | undefined,
    medianValue: row.median_value as number | undefined,
    p25Value: row.p25_value as number | undefined,
    p75Value: row.p75_value as number | undefined,
    sampleSize: row.sample_size as number,
    updatedAt: row.updated_at as string,
  };
}

/** Fetch benchmarks with optional filters. */
export async function getBenchmarks(
  filters?: { eventType?: string; machineType?: string }
): Promise<Benchmark[]> {
  const supabase = await createClient();
  let query = supabase
    .from("benchmarks")
    .select("*")
    .order("metric_name");

  if (filters?.eventType) {
    query = query.eq("event_type", filters.eventType);
  }
  if (filters?.machineType) {
    query = query.eq("machine_type", filters.machineType);
  }

  const { data, error } = await query;
  if (error || !data) return [];
  return data.map(mapBenchmark);
}

/** Fetch benchmarks for a specific event type, for predicted-vs-actual comparison. */
export async function getBenchmarkForComparison(
  eventType: string,
  machineType?: string
): Promise<Benchmark[]> {
  const supabase = await createClient();
  let query = supabase
    .from("benchmarks")
    .select("*")
    .eq("event_type", eventType);

  if (machineType) {
    query = query.eq("machine_type", machineType);
  }

  const { data, error } = await query.order("metric_name");
  if (error || !data) return [];
  return data.map(mapBenchmark);
}
