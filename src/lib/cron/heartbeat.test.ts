/**
 * Tests for the cron heartbeat.
 *
 * The behaviour that matters: a job that stops being invoked must read as
 * stale (not as healthy), a heartbeat write must never break the job it is
 * reporting on, and consecutive failures must reset on the next success.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

import { createMockSupabase } from "@/test/supabase";
import {
  CRON_JOBS,
  recordCronRun,
  assessCronHealth,
  summariseCronHealth,
  type CronRunRow,
} from "./heartbeat";

const NOW = new Date("2026-07-28T12:00:00Z");

function row(overrides: Partial<CronRunRow> = {}): CronRunRow {
  return {
    job: "digest",
    last_run_at: NOW.toISOString(),
    last_status: "ok",
    last_detail: {},
    run_count: 10,
    consecutive_failures: 0,
    ...overrides,
  };
}

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("recordCronRun", () => {
  it("increments the run count from the existing row", async () => {
    const supabase = createMockSupabase();
    supabase.queueTableResponses("cron_runs", [
      { data: { run_count: 41, consecutive_failures: 0 }, error: null },
      { data: null, error: null },
    ]);

    await recordCronRun(supabase, "digest", "ok", { sent: 3 });

    const upsert = supabase
      .callsFor("cron_runs")
      .find((c) => c.method === "upsert");
    expect((upsert?.args[0] as { run_count: number }).run_count).toBe(42);
    expect((upsert?.args[0] as { last_detail: unknown }).last_detail).toEqual({
      sent: 3,
    });
  });

  it("counts consecutive failures", async () => {
    const supabase = createMockSupabase();
    supabase.queueTableResponses("cron_runs", [
      { data: { run_count: 5, consecutive_failures: 2 }, error: null },
      { data: null, error: null },
    ]);

    await recordCronRun(supabase, "reports", "error", { message: "boom" });

    const upsert = supabase
      .callsFor("cron_runs")
      .find((c) => c.method === "upsert");
    expect(
      (upsert?.args[0] as { consecutive_failures: number }).consecutive_failures
    ).toBe(3);
  });

  it("resets the failure streak on a successful run", async () => {
    const supabase = createMockSupabase();
    supabase.queueTableResponses("cron_runs", [
      { data: { run_count: 5, consecutive_failures: 4 }, error: null },
      { data: null, error: null },
    ]);

    await recordCronRun(supabase, "reports", "ok");

    const upsert = supabase
      .callsFor("cron_runs")
      .find((c) => c.method === "upsert");
    expect(
      (upsert?.args[0] as { consecutive_failures: number }).consecutive_failures
    ).toBe(0);
  });

  it("starts at one when the job has never reported before", async () => {
    const supabase = createMockSupabase();
    supabase.setTableResponse("cron_runs", { data: null, error: null });

    await recordCronRun(supabase, "pipedrive", "ok");

    const upsert = supabase
      .callsFor("cron_runs")
      .find((c) => c.method === "upsert");
    expect((upsert?.args[0] as { run_count: number }).run_count).toBe(1);
  });

  it("never throws when the heartbeat write itself fails", async () => {
    const supabase = createMockSupabase();
    supabase.setTableResponse("cron_runs", {
      data: null,
      error: { message: "table missing" },
    });

    await expect(
      recordCronRun(supabase, "digest", "ok")
    ).resolves.toBeUndefined();
    expect(console.error).toHaveBeenCalled();
  });

  it("never throws when the client itself blows up", async () => {
    const exploding = {
      from: () => {
        throw new Error("no connection");
      },
    };

    await expect(
      recordCronRun(exploding, "digest", "ok")
    ).resolves.toBeUndefined();
  });
});

describe("assessCronHealth", () => {
  it("reports a job that has never run as never_run, not stale", () => {
    const jobs = assessCronHealth([], NOW);

    expect(jobs).toHaveLength(Object.keys(CRON_JOBS).length);
    expect(jobs.every((j) => j.status === "never_run")).toBe(true);
    expect(jobs[0].lastRunAt).toBeNull();
  });

  it("reports a recently-run job as ok", () => {
    const jobs = assessCronHealth([row({ job: "digest" })], NOW);

    expect(jobs.find((j) => j.job === "digest")?.status).toBe("ok");
    expect(jobs.find((j) => j.job === "digest")?.minutesSinceLastRun).toBe(0);
  });

  it("reports an hourly job silent for two hours as stale", () => {
    const twoHoursAgo = new Date(NOW.getTime() - 120 * 60_000).toISOString();

    const jobs = assessCronHealth(
      [row({ job: "digest", last_run_at: twoHoursAgo })],
      NOW
    );

    expect(jobs.find((j) => j.job === "digest")?.status).toBe("stale");
    expect(jobs.find((j) => j.job === "digest")?.minutesSinceLastRun).toBe(120);
  });

  it("keeps a daily job healthy after two hours of silence", () => {
    const twoHoursAgo = new Date(NOW.getTime() - 120 * 60_000).toISOString();

    const jobs = assessCronHealth(
      [row({ job: "purge-leads", last_run_at: twoHoursAgo })],
      NOW
    );

    expect(jobs.find((j) => j.job === "purge-leads")?.status).toBe("ok");
  });

  it("prefers stale over the last recorded status", () => {
    const threeDaysAgo = new Date(
      NOW.getTime() - 3 * 24 * 60 * 60_000
    ).toISOString();

    const jobs = assessCronHealth(
      [row({ job: "reminders", last_run_at: threeDaysAgo, last_status: "ok" })],
      NOW
    );

    expect(jobs.find((j) => j.job === "reminders")?.status).toBe("stale");
  });

  it("surfaces a failing but still-ticking job as error", () => {
    const jobs = assessCronHealth(
      [row({ job: "digest", last_status: "error", consecutive_failures: 3 })],
      NOW
    );

    const digest = jobs.find((j) => j.job === "digest");
    expect(digest?.status).toBe("error");
    expect(digest?.consecutiveFailures).toBe(3);
  });
});

describe("summariseCronHealth", () => {
  it("is unknown before any job has ever run", () => {
    expect(summariseCronHealth(assessCronHealth([], NOW))).toBe("unknown");
  });

  it("is degraded when any job is stale", () => {
    const old = new Date(NOW.getTime() - 5 * 60 * 60_000).toISOString();
    const jobs = assessCronHealth(
      [row({ job: "digest", last_run_at: old })],
      NOW
    );

    expect(summariseCronHealth(jobs)).toBe("degraded");
  });

  it("is ok when every reporting job is healthy", () => {
    const jobs = assessCronHealth(
      (Object.keys(CRON_JOBS) as (keyof typeof CRON_JOBS)[]).map((job) =>
        row({ job })
      ),
      NOW
    );

    expect(summariseCronHealth(jobs)).toBe("ok");
  });
});
