/**
 * FYI digest cron — runs hourly.
 *
 * For every recipient who has at least one archetype set to
 * `email_mode: "digest"` (or whose archetype default is `digest`), bundle
 * the matching unread in-portal notifications from the last 24 hours into
 * a single email. The goal is exactly one email per recipient per day,
 * not one per archetype.
 *
 * The cron ticks hourly but only actually sends to a recipient when it is
 * their chosen local digest hour, they are outside their quiet-hours window,
 * and they have not already received a digest today. That per-recipient
 * decision lives in `lib/notifications/digest-timing`; we stamp
 * `notification_user_settings.last_digest_sent_at` after each send to dedup.
 */

import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { Resend } from "resend";

import { getServiceRoleClient } from "@/lib/supabase/service-role";
import { requireCron } from "@/lib/cron-auth";
import { recordCronRun } from "@/lib/cron/heartbeat";
import { ARCHETYPES, type NotificationKind } from "@/lib/notifications/archetypes";
import { renderNotificationEmail } from "@/lib/notifications/email-shell";
import {
  shouldSendDigest,
  DEFAULT_DIGEST_TIMING,
  type DigestTiming,
} from "@/lib/notifications/digest-timing";
import { forEachChunk } from "@/lib/queries/chunk";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;
const FROM_EMAIL = process.env.FROM_EMAIL ?? "noreply@brightblue.co.uk";

interface PendingNotification {
  id: string;
  user_id: string;
  title: string;
  body: string | null;
  link: string | null;
  kind: string | null;
  created_at: string;
}

export async function GET(request: Request) {
  if (!requireCron(request)) {
    return NextResponse.json({ error: "unauthorised" }, { status: 401 });
  }

  const supabase = getServiceRoleClient();

  // Still a heartbeat: the scheduler is alive, we just have nothing to send
  // with. Without this the job would read as stale on an unconfigured env.
  if (!resend) {
    await recordCronRun(supabase, "digest", "ok", { skipped: "no_resend_key" });
    return NextResponse.json({
      ok: true,
      note: "Resend not configured — skipping digest send.",
    });
  }

  const now = new Date();

  const since = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();

  const { data: notifications } = await supabase
    .from("notifications")
    .select("id, user_id, title, body, link, kind, created_at")
    .gt("created_at", since)
    .eq("is_read", false);

  if (!notifications || notifications.length === 0) {
    await recordCronRun(supabase, "digest", "ok", { digestSent: 0 });
    return NextResponse.json({ ok: true, digestSent: 0 });
  }

  const byUser = new Map<string, PendingNotification[]>();
  for (const row of notifications as PendingNotification[]) {
    const bucket = byUser.get(row.user_id) ?? [];
    bucket.push(row);
    byUser.set(row.user_id, bucket);
  }

  // Every lookup below fans out over the recipient list, which grows with the
  // user base. Chunked so the `in.(...)` filter cannot overflow the request URL
  // — the failure mode is a whole night's digest silently not sending.
  const userIds = Array.from(byUser.keys());
  type Profile = { id: string; name: string; email: string };
  const profiles = await forEachChunk(userIds, async (batch) => {
    const { data } = await supabase
      .from("profiles")
      .select("id, name, email")
      .in("id", batch)
      .eq("is_active", true);
    return (data ?? []) as unknown as Profile[];
  });
  const profileById = new Map<string, Profile>(
    profiles.map((p) => [p.id, p])
  );

  type PrefRow = {
    user_id: string;
    kind: string;
    email_mode: "immediate" | "digest" | "off";
  };
  const preferences = await forEachChunk(userIds, async (batch) => {
    const { data } = await supabase
      .from("notification_preferences")
      .select("user_id, kind, email_mode")
      .in("user_id", batch);
    return (data ?? []) as unknown as PrefRow[];
  });
  const prefByUserKind = new Map<string, "immediate" | "digest" | "off">();
  for (const row of preferences) {
    prefByUserKind.set(`${row.user_id}::${row.kind}`, row.email_mode);
  }

  function modeFor(userId: string, kind: NotificationKind): string {
    const explicit = prefByUserKind.get(`${userId}::${kind}`);
    if (explicit) return explicit;
    return ARCHETYPES[kind]?.defaults.emailMode ?? "digest";
  }

  type TimingRow = {
    user_id: string;
    timezone: string;
    digest_hour: number;
    quiet_start_hour: number;
    quiet_end_hour: number;
    last_digest_sent_at: string | null;
  };
  const timingRows = await forEachChunk(userIds, async (batch) => {
    const { data } = await supabase
      .from("notification_user_settings")
      .select(
        "user_id, timezone, digest_hour, quiet_start_hour, quiet_end_hour, last_digest_sent_at",
      )
      .in("user_id", batch);
    return (data ?? []) as unknown as TimingRow[];
  });
  const timingByUser = new Map<string, TimingRow>();
  for (const row of timingRows) {
    timingByUser.set(row.user_id, row);
  }

  function timingFor(userId: string): DigestTiming {
    const row = timingByUser.get(userId);
    if (!row) {
      return { ...DEFAULT_DIGEST_TIMING, lastSentAt: null };
    }
    return {
      timezone: row.timezone,
      digestHour: row.digest_hour,
      quietStartHour: row.quiet_start_hour,
      quietEndHour: row.quiet_end_hour,
      lastSentAt: row.last_digest_sent_at
        ? new Date(row.last_digest_sent_at)
        : null,
    };
  }

  let sent = 0;
  let skippedForTiming = 0;
  for (const [userId, items] of byUser) {
    const profile = profileById.get(userId);
    if (!profile) continue;

    // Only send in the recipient's local digest hour, outside quiet hours,
    // and at most once per day.
    if (!shouldSendDigest(now, timingFor(userId))) {
      skippedForTiming += 1;
      continue;
    }

    const digestItems = items.filter((item) => {
      const kind = item.kind as NotificationKind | null;
      if (!kind) return false;
      // Action-required archetypes were emailed immediately; the digest is
      // strictly for FYI items the recipient hasn't opened yet.
      const archetype = ARCHETYPES[kind];
      if (!archetype || archetype.classOf !== "fyi") return false;
      return modeFor(userId, kind) === "digest";
    });

    if (digestItems.length === 0) continue;

    const baseUrl =
      process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
    const lines = digestItems
      .slice(0, 8)
      .map((i) => `• ${i.title}${i.body ? ` — ${i.body}` : ""}`)
      .join("\n");
    const moreCount = Math.max(0, digestItems.length - 8);
    const body =
      `${digestItems.length} update${digestItems.length === 1 ? "" : "s"} from the last day:\n\n${lines}` +
      (moreCount > 0 ? `\n\n… and ${moreCount} more in the portal.` : "");

    const html = renderNotificationEmail({
      eyebrow: "FYI",
      subject: "Your daily Bright.Experience digest",
      body,
      ctaLabel: "Open the portal",
      ctaHref: `${baseUrl}/notifications`,
    });

    try {
      await resend.emails.send({
        from: `Bright.Experience <${FROM_EMAIL}>`,
        to: [profile.email],
        subject: "Your daily Bright.Experience digest",
        html,
      });
      sent += 1;
      // Stamp the dedup ledger so the next hourly tick won't re-send today.
      await supabase
        .from("notification_user_settings")
        .upsert(
          { user_id: userId, last_digest_sent_at: now.toISOString() },
          { onConflict: "user_id" },
        );
    } catch (err) {
      Sentry.captureException(err, { tags: { cron: "digest" } });
      console.error(`[Digest] send failed for ${profile.email}`, err);
    }
  }

  await recordCronRun(supabase, "digest", "ok", {
    digestSent: sent,
    skippedForTiming,
  });
  return NextResponse.json({ ok: true, digestSent: sent, skippedForTiming });
}
