/**
 * Lead retention purge cron.
 *
 * Deletes captured leads once they age past their event's retention window
 * (game_configurations.retention_days, default 60 days) — the enforcement
 * behind the retention promise shown on every post-event report
 * (docs/13-dev-handover-priorities.md P2.4).
 *
 * Two sweeps:
 *   1. Events with a game_configurations row — purge on their own window.
 *   2. Everything else — purge on the default window (bounded batch).
 *
 * Expected caller: Vercel Cron (see vercel.json), daily.
 * Auth: `Authorization: Bearer ${CRON_SECRET}` (src/lib/cron-auth.ts).
 */

import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";

import { getServiceRoleClient } from "@/lib/supabase/service-role";
import { requireCron } from "@/lib/cron-auth";
import { recordCronRun } from "@/lib/cron/heartbeat";
import { DEFAULT_RETENTION_DAYS } from "@/lib/capture-rules";
import { forEachChunk } from "@/lib/queries/chunk";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DAY_MS = 24 * 60 * 60 * 1000;
/** Per-run cap on the default sweep so a backlog can't stall the cron. */
const SWEEP_LIMIT = 10_000;

export async function GET(request: Request) {
  if (!requireCron(request)) {
    return NextResponse.json({ error: "unauthorised" }, { status: 401 });
  }

  const supabase = getServiceRoleClient();
  const now = Date.now();
  let purged = 0;
  // Per-sweep failures are swallowed so one bad event can't stop the purge, but
  // they must still colour the heartbeat — a purge that silently fails every
  // night means we are holding personal data past the promised window.
  let failures = 0;

  // Sweep 1 — events with an explicit configuration row use their own window.
  const { data: configs, error: configErr } = await supabase
    .from("game_configurations")
    .select("event_id, retention_days");

  if (configErr) {
    console.error("[Cron:purge-leads] config query failed", configErr);
    await recordCronRun(supabase, "purge-leads", "error", {
      stage: "config_query",
      message: configErr.message,
    });
    return NextResponse.json({ error: "query failed" }, { status: 500 });
  }

  const configured = (configs ?? []) as {
    event_id: string;
    retention_days: number | null;
  }[];

  for (const config of configured) {
    const days = config.retention_days ?? DEFAULT_RETENTION_DAYS;
    const cutoff = new Date(now - days * DAY_MS).toISOString();
    try {
      const { data: deleted, error } = await supabase
        .from("leads")
        .delete()
        .eq("event_id", config.event_id)
        .lt("captured_at", cutoff)
        .select("id");
      if (error) throw new Error(error.message);
      if (deleted && deleted.length > 0) {
        purged += deleted.length;
        console.log(
          `[Cron:purge-leads] purged ${deleted.length} leads for event ${config.event_id} (window ${days}d)`
        );
      }
    } catch (err) {
      failures += 1;
      Sentry.captureException(err, {
        tags: { cron: "purge_leads", eventId: config.event_id },
      });
      console.error(`[Cron:purge-leads] purge failed for ${config.event_id}`, err);
    }
  }

  // Sweep 2 — events without a configuration row fall back to the default
  // window. Bounded batch; anything left over is caught on the next run.
  const configuredIds = new Set(configured.map((c) => c.event_id));
  const defaultCutoff = new Date(now - DEFAULT_RETENTION_DAYS * DAY_MS).toISOString();
  try {
    const { data: stale, error: staleErr } = await supabase
      .from("leads")
      .select("id, event_id")
      .lt("captured_at", defaultCutoff)
      .limit(SWEEP_LIMIT);
    if (staleErr) throw new Error(staleErr.message);

    const staleIds = ((stale ?? []) as { id: string; event_id: string }[])
      .filter((lead) => !configuredIds.has(lead.event_id))
      .map((lead) => lead.id);

    if (staleIds.length > 0) {
      // Chunked: a single `in.(...)` of up to SWEEP_LIMIT ids overflows the
      // request URL and the delete fails outright.
      await forEachChunk(staleIds, async (batch) => {
        const { error: deleteErr } = await supabase
          .from("leads")
          .delete()
          .in("id", batch);
        if (deleteErr) throw new Error(deleteErr.message);
        return [];
      });
      purged += staleIds.length;
      console.log(
        `[Cron:purge-leads] purged ${staleIds.length} leads on the default ${DEFAULT_RETENTION_DAYS}d window`
      );
    }
  } catch (err) {
    failures += 1;
    Sentry.captureException(err, { tags: { cron: "purge_leads" } });
    console.error("[Cron:purge-leads] default sweep failed", err);
  }

  await recordCronRun(
    supabase,
    "purge-leads",
    failures > 0 ? "error" : "ok",
    { purged, failures }
  );

  return NextResponse.json({ ok: true, purged });
}
