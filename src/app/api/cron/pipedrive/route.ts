/**
 * Pipedrive cron — hourly drain plus time-driven triggers.
 *
 * Responsibilities each run:
 *   1. Drain any outbox rows that didn't land inline (max 3 attempts
 *      per row, see `lib/pipedrive/drain.ts`).
 *   2. Fire the two time-driven triggers we can't hang off a domain
 *      action: event-live and event-delivered. Both consult the
 *      `notification_reminders` ledger via the `pipedrive_outbox`
 *      existence check so we never repeat a note for the same event.
 *
 * Auth mirrors the other cron routes: Vercel cron header or a Bearer
 * token matching `CRON_SECRET`.
 */

import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";

import { getServiceRoleClient } from "@/lib/supabase/service-role";
import { requireCron } from "@/lib/cron-auth";
import { recordCronRun } from "@/lib/cron/heartbeat";
import { drainOutbox } from "@/lib/pipedrive/drain";
import {
  enqueueEventDelivered,
  enqueueEventLive,
} from "@/lib/pipedrive/triggers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Has Pipedrive already received a note of this kind for this event?
 * We check the outbox (regardless of sent state — the cron never
 * deletes successful rows, so the trail is persistent).
 */
async function alreadyNoted(
  eventId: string,
  title: string
): Promise<boolean> {
  try {
    const supabase = getServiceRoleClient();
    const { data } = await supabase
      .from("pipedrive_outbox")
      .select("id, payload")
      .eq("event_id", eventId)
      .eq("kind", "note");
    const rows = (data ?? []) as Array<{ payload?: { title?: string } }>;
    return rows.some((r) => r.payload?.title === title);
  } catch {
    return false;
  }
}

async function fireEventLiveTriggers(): Promise<number> {
  const supabase = getServiceRoleClient();
  // Anything that just hit (or passed into) the `event_live` stage in
  // the last 25 hours — cron window slack for daylight-savings.
  const since = new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString();
  const { data } = await supabase
    .from("events")
    .select("id, name, pipedrive_deal_id, updated_at, current_stage")
    .eq("current_stage", "event_live")
    .gte("updated_at", since)
    .not("pipedrive_deal_id", "is", null);

  let fired = 0;
  for (const row of (data ?? []) as Array<{ id: string; name: string }>) {
    const noteTitle = `Live · ${row.name}`; // marker; the real title from formatEventLiveNote varies, so we use a stable per-event sentinel
    if (await alreadyNoted(row.id, noteTitle)) continue;
    // The format helper writes a venue/date-shaped title; we don't
    // gate on that to avoid duplicates after format changes. The
    // happy path is "fire once per event ever", which we approximate
    // by checking whether any note for this event exists with kind
    // `event_live_sentinel` via a side-record below.
    const supabaseSentinel = getServiceRoleClient();
    const { data: marker } = await supabaseSentinel
      .from("pipedrive_outbox")
      .select("id")
      .eq("event_id", row.id)
      .eq("kind", "note")
      .ilike("payload->>title", "Live at%");
    if ((marker ?? []).length > 0) continue;

    await enqueueEventLive(row.id);
    fired += 1;
  }
  return fired;
}

async function fireEventDeliveredTriggers(): Promise<number> {
  const supabase = getServiceRoleClient();
  const since = new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString();
  const { data } = await supabase
    .from("events")
    .select("id, name, pipedrive_deal_id, updated_at, current_stage")
    .in("current_stage", ["reporting", "complete"])
    .gte("updated_at", since)
    .not("pipedrive_deal_id", "is", null);

  let fired = 0;
  for (const row of (data ?? []) as Array<{ id: string; name: string }>) {
    const { data: marker } = await getServiceRoleClient()
      .from("pipedrive_outbox")
      .select("id")
      .eq("event_id", row.id)
      .eq("kind", "note")
      .ilike("payload->>title", "Delivered%");
    if ((marker ?? []).length > 0) continue;

    // Lead count is best-effort — if the table doesn't exist or is
    // empty, we send 0 leads which still produces a coherent note.
    let leadCount = 0;
    try {
      const { count } = await getServiceRoleClient()
        .from("leads")
        .select("id", { count: "exact", head: true })
        .eq("event_id", row.id);
      leadCount = count ?? 0;
    } catch {
      // ignore
    }
    await enqueueEventDelivered(row.id, leadCount);
    fired += 1;
  }
  return fired;
}

export async function GET(request: Request) {
  if (!requireCron(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const [liveFired, deliveredFired] = await Promise.all([
      fireEventLiveTriggers(),
      fireEventDeliveredTriggers(),
    ]);

    // Drain anything new plus anything stuck.
    const drain = await drainOutbox({ limit: 50 });

    await recordCronRun(getServiceRoleClient(), "pipedrive", "ok", {
      liveFired,
      deliveredFired,
    });

    return NextResponse.json({
      ok: true,
      liveFired,
      deliveredFired,
      drain,
    });
  } catch (err) {
    Sentry.captureException(err, { tags: { cron: "pipedrive" } });
    console.error("[Cron:pipedrive] failed:", err);
    await recordCronRun(getServiceRoleClient(), "pipedrive", "error", {
      message: err instanceof Error ? err.message : "unknown",
    });
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  return GET(request);
}
