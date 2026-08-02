/**
 * Health check.
 *
 * Expected caller: an uptime monitor, a deploy smoke test, or an engineer.
 * Auth: none for the summary; `Authorization: Bearer ${CRON_SECRET}` unlocks
 * the detail. The split matters — a public endpoint that names the applied
 * migration and lists every scheduled job is reconnaissance, but a monitor
 * still needs a stable status code to alert on.
 *
 * Payload (public):   { status, checks: { database, cron } }
 * Payload (detailed): adds migration version, per-job freshness, timings.
 *
 * Status codes: 200 when healthy or degraded-but-serving, 503 when the
 * database is unreachable. A degraded cron does not fail the check — the app
 * is still serving requests — so page on the body, not just the code.
 */

import { NextResponse } from "next/server";

import { getServiceRoleClient } from "@/lib/supabase/service-role";
import {
  assessCronHealth,
  summariseCronHealth,
  type CronRunRow,
} from "@/lib/cron/heartbeat";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isDetailed(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

export async function GET(request: Request) {
  const detailed = isDetailed(request);
  const startedAt = Date.now();

  let database: "ok" | "unreachable" = "ok";
  let databaseMs: number | null = null;
  let migrationVersion: string | null = null;
  let cronRows: CronRunRow[] = [];

  try {
    const supabase = getServiceRoleClient();

    // Cheapest possible round-trip that still proves the connection and the
    // schema: a bounded read of a table that always exists.
    const pingStart = Date.now();
    const { error } = await supabase
      .from("events")
      .select("id", { head: true, count: "estimated" })
      .limit(1);
    databaseMs = Date.now() - pingStart;
    if (error) throw new Error(error.message);

    const { data: versionData } = await supabase.rpc("schema_migration_version");
    migrationVersion = typeof versionData === "string" ? versionData : null;

    const { data: runs } = await supabase
      .from("cron_runs")
      .select(
        "job, last_run_at, last_status, last_detail, run_count, consecutive_failures"
      );
    cronRows = (runs ?? []) as CronRunRow[];
  } catch (err) {
    database = "unreachable";
    console.error("[health] database check failed", err);
  }

  const jobs = assessCronHealth(cronRows);
  const cron = database === "ok" ? summariseCronHealth(jobs) : "unknown";
  const status =
    database !== "ok" ? "unhealthy" : cron === "degraded" ? "degraded" : "ok";

  const body: Record<string, unknown> = {
    status,
    checks: { database, cron },
  };

  if (detailed) {
    body.detail = {
      migrationVersion,
      databaseMs,
      totalMs: Date.now() - startedAt,
      jobs,
      commit: process.env.VERCEL_GIT_COMMIT_SHA ?? null,
      environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV,
    };
  }

  return NextResponse.json(body, {
    status: database === "ok" ? 200 : 503,
    headers: { "Cache-Control": "no-store" },
  });
}
