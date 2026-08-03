/** Distils fleet benchmark rows into an honest plays-per-day range for one machine, for public catalog surfaces. */
import type { Benchmark } from "@/types";

export interface MachinePlaysBenchmark {
  lowPerDay: number;
  highPerDay: number;
  sampleSize: number;
}

/**
 * Derive a plays-per-day range for one machine from fleet benchmark rows.
 * Only exact matches on metricName and machineType are considered.
 */
export function playsBenchmarkForMachine(
  machineName: string,
  benchmarks: Benchmark[],
): MachinePlaysBenchmark | null {
  const rowLows: number[] = [];
  const rowHighs: number[] = [];
  let sampleSize = 0;

  for (const row of benchmarks) {
    if (row.metricName !== "plays_per_day") continue;
    if (row.machineType !== machineName) continue;

    const rowLow = row.p25Value ?? row.medianValue ?? row.avgValue;
    const rowHigh = row.p75Value ?? row.medianValue ?? row.avgValue;

    if (rowLow == null || rowHigh == null) continue;

    rowLows.push(rowLow);
    rowHighs.push(rowHigh);
    sampleSize += row.sampleSize;
  }

  if (rowLows.length === 0) return null;

  return {
    lowPerDay: Math.round(Math.min(...rowLows)),
    highPerDay: Math.round(Math.max(...rowHighs)),
    sampleSize,
  };
}

/** Format a plays benchmark as customer-facing copy, e.g. "175–300 plays/day". */
export function formatPlaysBenchmark(b: MachinePlaysBenchmark): string {
  return `${b.lowPerDay}–${b.highPerDay} plays/day`;
}
