/**
 * Daily FYI digest cron — 17:00 UTC.
 *
 * For every recipient who has at least one archetype set to
 * `email_mode: "digest"` (or whose archetype default is `digest`), bundle
 * the matching unread in-portal notifications from the last 24 hours into
 * a single email. The goal is exactly one email per recipient per day,
 * not one per archetype.
 */

import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { Resend } from "resend";

import { getServiceRoleClient } from "@/lib/supabase/service-role";
import { ARCHETYPES, type NotificationKind } from "@/lib/notifications/archetypes";
import { renderNotificationEmail } from "@/lib/notifications/email-shell";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;
const FROM_EMAIL = process.env.FROM_EMAIL ?? "noreply@brightblue.co.uk";

function authed(request: Request): boolean {
  if (request.headers.get("x-vercel-cron")) return true;
  const auth = request.headers.get("authorization");
  if (!auth) return false;
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return auth === `Bearer ${secret}`;
}

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
  if (!authed(request)) {
    return NextResponse.json({ error: "unauthorised" }, { status: 401 });
  }

  if (!resend) {
    return NextResponse.json({
      ok: true,
      note: "Resend not configured — skipping digest send.",
    });
  }

  const supabase = getServiceRoleClient();

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const { data: notifications } = await supabase
    .from("notifications")
    .select("id, user_id, title, body, link, kind, created_at")
    .gt("created_at", since)
    .eq("is_read", false);

  if (!notifications || notifications.length === 0) {
    return NextResponse.json({ ok: true, digestSent: 0 });
  }

  const byUser = new Map<string, PendingNotification[]>();
  for (const row of notifications as PendingNotification[]) {
    const bucket = byUser.get(row.user_id) ?? [];
    bucket.push(row);
    byUser.set(row.user_id, bucket);
  }

  const userIds = Array.from(byUser.keys());
  const { data: profilesRaw } = await supabase
    .from("profiles")
    .select("id, name, email")
    .in("id", userIds)
    .eq("is_active", true);
  type Profile = { id: string; name: string; email: string };
  const profiles = (profilesRaw ?? []) as unknown as Profile[];
  const profileById = new Map<string, Profile>(
    profiles.map((p) => [p.id, p])
  );

  const { data: preferencesRaw } = await supabase
    .from("notification_preferences")
    .select("user_id, kind, email_mode")
    .in("user_id", userIds);
  type PrefRow = {
    user_id: string;
    kind: string;
    email_mode: "immediate" | "digest" | "off";
  };
  const preferences = (preferencesRaw ?? []) as unknown as PrefRow[];
  const prefByUserKind = new Map<string, "immediate" | "digest" | "off">();
  for (const row of preferences) {
    prefByUserKind.set(`${row.user_id}::${row.kind}`, row.email_mode);
  }

  function modeFor(userId: string, kind: NotificationKind): string {
    const explicit = prefByUserKind.get(`${userId}::${kind}`);
    if (explicit) return explicit;
    return ARCHETYPES[kind]?.defaults.emailMode ?? "digest";
  }

  let sent = 0;
  for (const [userId, items] of byUser) {
    const profile = profileById.get(userId);
    if (!profile) continue;

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
      process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3001";
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
    } catch (err) {
      Sentry.captureException(err, { tags: { cron: "digest" } });
      console.error(`[Digest] send failed for ${profile.email}`, err);
    }
  }

  return NextResponse.json({ ok: true, digestSent: sent });
}
