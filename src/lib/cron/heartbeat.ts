/**
 * Cron heartbeat — records that a scheduled job ran, and how it went.
 *
 * Every cron route calls `recordCronRun` on the way out. `/api/health` reads
 * the resulting `cron_runs` rows so a scheduler that has quietly stopped shows
 * up as a stale job instead of as an absence of activity.
 */

/** The scheduled jobs we expect to hear from, with their tolerated silence. */
export const CRON_JOBS = {
  reminders: { schedule: "0 9 * * *", staleAfterMinutes: 60 * 26 },
  digest: { schedule: "0 * * * *", staleAfterMinutes: 90 },
  pipedrive: { schedule: "0 * * * *", staleAfterMinutes: 90 },
  reports: { schedule: "0 8 * * *", staleAfterMinutes: 60 * 26 },
  "purge-leads": { schedule: "30 2 * * *", staleAfterMinutes: 60 * 26 },
} as const;

export type CronJob = keyof typeof CRON_JOBS;

export interface CronRunRow {
  job: string;
  last_run_at: string;
  last_status: "ok" | "error";
  last_detail: Record<string, unknown>;
  run_count: number;
  consecutive_failures: number;
}

/** A job's freshness as reported by the health endpoint. */
export interface CronJobHealth {
  job: CronJob;
  status: "ok" | "error" | "stale" | "never_run";
  lastRunAt: string | null;
  minutesSinceLastRun: number | null;
  consecutiveFailures: number;
}

/**
 * Upsert the heartbeat row for a job.
 *
 * Never throws: a failure to record the heartbeat must not turn a successful
 * cron run into a 500. It reports to the console (and Sentry, via the caller's
 * own error handling) and moves on.
 */
export async function recordCronRun(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  job: CronJob,
  status: "ok" | "error",
  detail: Record<string, unknown> = {}
): Promise<void> {
  try {
    // Read the current counters first: PostgREST has no expression-based
    // increment, and a lost increment here matters far less than a failed job.
    const { data: existing } = await supabase
      .from("cron_runs")
      .select("run_count, consecutive_failures")
      .eq("job", job)
      .maybeSingle();

    const runCount = Number(existing?.run_count ?? 0) + 1;
    const failures =
      status === "error" ? Number(existing?.consecutive_failures ?? 0) + 1 : 0;

    const { error } = await supabase.from("cron_runs").upsert(
      {
        job,
        last_run_at: new Date().toISOString(),
        last_status: status,
        last_detail: detail,
        run_count: runCount,
        consecutive_failures: failures,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "job" }
    );

    if (error) {
      console.error(`[cron:${job}] heartbeat write failed`, error);
    }
  } catch (err) {
    console.error(`[cron:${job}] heartbeat write threw`, err);
  }
}

/**
 * Classify each expected job against its heartbeat row.
 *
 * A job that has never run is `never_run` rather than `stale` — on a fresh
 * deploy that is expected, and conflating the two would make the health
 * endpoint cry wolf for the first day.
 */
export function assessCronHealth(
  rows: CronRunRow[],
  now: Date = new Date()
): CronJobHealth[] {
  const byJob = new Map(rows.map((r) => [r.job, r]));

  return (Object.keys(CRON_JOBS) as CronJob[]).map((job) => {
    const row = byJob.get(job);
    if (!row) {
      return {
        job,
        status: "never_run",
        lastRunAt: null,
        minutesSinceLastRun: null,
        consecutiveFailures: 0,
      };
    }

    const lastRun = new Date(row.last_run_at);
    const minutes = Math.floor((now.getTime() - lastRun.getTime()) / 60_000);
    const stale = minutes > CRON_JOBS[job].staleAfterMinutes;

    return {
      job,
      // Staleness outranks the last recorded status: a job that succeeded once
      // and then stopped being invoked is a bigger problem than one that failed
      // on its most recent run and is still ticking.
      status: stale ? "stale" : row.last_status,
      lastRunAt: row.last_run_at,
      minutesSinceLastRun: minutes,
      consecutiveFailures: Number(row.consecutive_failures ?? 0),
    };
  });
}

/** Overall verdict across all jobs, for the health endpoint's status field. */
export function summariseCronHealth(
  jobs: CronJobHealth[]
): "ok" | "degraded" | "unknown" {
  if (jobs.some((j) => j.status === "stale" || j.status === "error")) {
    return "degraded";
  }
  if (jobs.every((j) => j.status === "never_run")) return "unknown";
  return "ok";
}
