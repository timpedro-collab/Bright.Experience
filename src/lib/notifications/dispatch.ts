/**
 * The single entry point for any code that wants to notify a human.
 *
 * Every domain action — `uploadAsset`, `decideApproval`, `advanceStage`,
 * the reminder cron — calls `dispatchNotification(kind, context)`. The
 * dispatcher:
 *
 *   1. Looks the archetype up from `archetypes.ts` (catalogue).
 *   2. Resolves recipients via `resolve-owners.ts`.
 *   3. Renders title/body/link from the archetype templates + context.
 *   4. Writes one `notifications` row per recipient (in-portal lane).
 *   5. For each recipient, consults `notification_preferences` to decide
 *      whether the email lane fires now, gets deferred to a digest, or is
 *      skipped (with the Class A override applied when `isReminder` and
 *      the escalation has reached the cron-override threshold).
 *   6. Sends one email per archetype + recipient via Resend.
 *
 * Class A archetypes ALWAYS write the in-portal row regardless of the
 * recipient's `in_portal` preference — that's the "Always on" guardrail
 * promised on the settings page.
 *
 * The dispatcher swallows individual failures so one bad recipient never
 * blocks the rest of a fan-out. Errors are surfaced via console for the
 * Vercel log.
 */

import { Resend } from "resend";

import { createClient } from "@/lib/supabase/server";
import {
  ARCHETYPES,
  fillTemplate,
  type NotificationKind,
} from "./archetypes";
import {
  resolveOwners,
  type DispatchContext,
  type SupabaseLike,
} from "./resolve-owners";
import { isInternal } from "./roles";
import { renderNotificationEmail } from "./email-shell";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const FROM_EMAIL = process.env.FROM_EMAIL ?? "noreply@brightblue.co.uk";

/** What the reminder cron passes when re-dispatching a stale subject. */
export interface ReminderHint {
  isReminder: true;
  /** 1 = first nudge, 2 = second nudge, etc. */
  escalationLevel: number;
  /** When true, the dispatcher overrides `email_mode: "off"` (Class A only). */
  overrideEmailOff: boolean;
  /** Optional CC list — used at escalation level 2+ to cc the AE. */
  ccEmails?: string[];
}

export interface DispatchOptions {
  reminder?: ReminderHint;
  /** If true, skip inserting an in-portal row (used by digest cron). */
  skipInPortal?: boolean;
  /** If true, skip sending email (used by in-portal-only re-runs). */
  skipEmail?: boolean;
  /**
   * Optional privileged Supabase client. The cron route passes the
   * service-role client here so it can write across all users without
   * tripping RLS; everywhere else the cookie-bound default is fine.
   */
  supabaseClient?: SupabaseLike;
}

interface PreferenceRow {
  user_id: string;
  kind: string;
  in_portal: boolean;
  email_mode: "immediate" | "digest" | "off";
}

async function getPreferences(
  userIds: string[],
  kind: NotificationKind,
  supabase: SupabaseLike
): Promise<Record<string, PreferenceRow>> {
  if (userIds.length === 0) return {};
  const { data } = await supabase
    .from("notification_preferences")
    .select("user_id, kind, in_portal, email_mode")
    .in("user_id", userIds)
    .eq("kind", kind);
  const map: Record<string, PreferenceRow> = {};
  for (const row of data ?? []) {
    map[row.user_id] = row as PreferenceRow;
  }
  return map;
}

function buildContext(
  context: DispatchContext
): Record<string, string | number | null | undefined> {
  const flat: Record<string, string | number | null | undefined> = {};
  for (const [k, v] of Object.entries(context)) {
    if (v === undefined || v === null) continue;
    if (typeof v === "boolean") continue;
    flat[k] = v as string | number;
  }
  return flat;
}

function reminderEyebrowFor(
  baseEyebrow: string,
  escalationLevel: number
): string {
  if (escalationLevel <= 1) return baseEyebrow;
  if (escalationLevel === 2) return "Reminder";
  return "Final reminder";
}

function reminderHintFor(escalationLevel: number): string {
  if (escalationLevel <= 1) return "";
  if (escalationLevel === 2)
    return "A gentle nudge — this one's been waiting on you for a couple of days.";
  return "Final reminder before we loop in your account manager.";
}

/**
 * Dispatch a notification archetype to its resolved owners.
 *
 * Returns the recipient IDs that received either an in-portal row or an
 * email, useful for callers (e.g. the cron) that want to upsert the
 * reminder ledger only for the people who actually got nudged.
 */
export async function dispatchNotification(
  kind: NotificationKind,
  context: DispatchContext,
  options: DispatchOptions = {}
): Promise<string[]> {
  const archetype = ARCHETYPES[kind];
  if (!archetype) {
    console.error(`[Dispatch] Unknown archetype kind: ${kind}`);
    return [];
  }

  const supabase = options.supabaseClient ?? (await createClient());
  let recipients = await resolveOwners(archetype, context, supabase);
  // Strip the actor from self-notifications. The actor is whoever
  // triggered the domain action; they don't need a ping for their own
  // submit. The synthetic fallback inbox is always kept.
  if (context.actorId) {
    const actor = String(context.actorId);
    recipients = recipients.filter(
      (r) => r.isFallbackTeamInbox || r.id !== actor
    );
  }
  // Apply roleScope as a safety net.
  if (archetype.roleScope && archetype.roleScope.length > 0) {
    const scope = archetype.roleScope as readonly string[];
    recipients = recipients.filter(
      (r) => scope.includes(r.role) || r.isFallbackTeamInbox
    );
  }
  // Enforce the archetype `audience` as a hard routing filter. An
  // `internal` archetype must never reach customer/partner accounts, and a
  // `customer` archetype must never reach internal staff, regardless of who
  // resolveOwners surfaced. `both` opts out. The synthetic fallback team
  // inbox is always kept so nothing is silently dropped.
  if (archetype.audience !== "both") {
    recipients = recipients.filter(
      (r) =>
        r.isFallbackTeamInbox ||
        (archetype.audience === "internal"
          ? isInternal(r.role)
          : !isInternal(r.role))
    );
  }
  if (recipients.length === 0) return [];

  const flatContext = buildContext(context);
  const title = fillTemplate(archetype.subjectTemplate, flatContext);
  const body = fillTemplate(archetype.bodyTemplate, flatContext);
  const link = fillTemplate(archetype.linkTemplate, flatContext);

  const reminderLevel = options.reminder?.escalationLevel ?? 0;
  const eyebrow = options.reminder
    ? reminderEyebrowFor(archetype.eyebrow, reminderLevel)
    : archetype.eyebrow;
  const reminderHint = options.reminder
    ? reminderHintFor(reminderLevel)
    : "";

  const realRecipients = recipients.filter((r) => !r.isFallbackTeamInbox);
  const fallbackInbox = recipients.find((r) => r.isFallbackTeamInbox);

  const preferences = await getPreferences(
    realRecipients.map((r) => r.id),
    kind,
    supabase
  );

  const notified: string[] = [];
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3001";

  // ── In-portal lane ────────────────────────────────────────
  if (!options.skipInPortal) {
    const rows = realRecipients
      .filter((r) => {
        if (archetype.classOf === "action_required") return true;
        const pref = preferences[r.id];
        if (!pref) return archetype.defaults.inPortal;
        return pref.in_portal;
      })
      .map((r) => ({
        user_id: r.id,
        event_id:
          context.eventId !== undefined ? String(context.eventId) : null,
        type: kind,
        kind,
        priority: archetype.priority,
        entity_type:
          context.entityType !== undefined ? String(context.entityType) : null,
        entity_id:
          context.entityId !== undefined ? String(context.entityId) : null,
        action_required: archetype.classOf === "action_required",
        title,
        body,
        link,
        is_read: false,
      }));

    if (rows.length > 0) {
      const { error } = await supabase.from("notifications").insert(rows);
      if (error) {
        console.error("[Dispatch] in-portal insert failed", error.message);
      } else {
        for (const r of rows) notified.push(r.user_id);
      }
    }
  }

  // ── Email lane ────────────────────────────────────────────
  if (!options.skipEmail && resend) {
    const ctaHref = link.startsWith("http") ? link : `${baseUrl}${link}`;

    const emailRecipients = realRecipients.filter((r) => {
      const pref = preferences[r.id];
      const mode = pref?.email_mode ?? archetype.defaults.emailMode;
      if (mode === "immediate") return true;
      if (mode === "digest") return false; // digest cron handles them
      if (mode === "off") {
        // Class A override after the cron decides we've waited long enough.
        if (
          archetype.classOf === "action_required" &&
          options.reminder?.overrideEmailOff
        ) {
          return true;
        }
        return false;
      }
      return false;
    });

    const allEmails =
      fallbackInbox && emailRecipients.length === 0
        ? [fallbackInbox]
        : emailRecipients;

    for (const recipient of allEmails) {
      const ctaLabel =
        archetype.classOf === "action_required" ? "Open the portal" : "Take a look";
      const html = renderNotificationEmail({
        eyebrow,
        subject: title,
        body,
        feedback:
          typeof context.feedback === "string" ? context.feedback : undefined,
        ctaLabel,
        ctaHref,
        reminderHint,
        manageAnchor: kind,
      });
      try {
        await resend.emails.send({
          from: `Bright.Experience <${FROM_EMAIL}>`,
          to: [recipient.email],
          cc:
            options.reminder?.ccEmails && options.reminder.ccEmails.length > 0
              ? options.reminder.ccEmails
              : undefined,
          subject: title,
          html,
        });
      } catch (error) {
        console.error(
          `[Dispatch] email send failed for ${recipient.email}:`,
          error
        );
      }
    }
  } else if (!options.skipEmail && !resend) {
    console.log(
      `[Dispatch] Resend not configured — skipping email for ${kind}.`
    );
  }

  return notified;
}
