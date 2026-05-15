/**
 * Reminder cron — daily 09:00 UTC.
 *
 * Scans the small, well-known set of "could be stuck" subjects and
 * dispatches re-nudges via the notification spine. Every send is recorded
 * in `notification_reminders` so the cron never duplicates a nudge inside
 * the cadence window.
 *
 * Class A archetypes get an email-mode override at the second escalation
 * level: even if the recipient has set `email_mode: "off"` for that
 * archetype, the cron will re-email them. That's the guardrail promised
 * on `/settings/notifications` and the reason action items can't actually
 * stall the project.
 *
 * Auth: either a Vercel Cron header (`x-vercel-cron`) or an explicit
 * `Authorization: Bearer ${CRON_SECRET}` header.
 */

import { NextResponse } from "next/server";

import { getServiceRoleClient } from "@/lib/supabase/service-role";
import {
  ARCHETYPES,
  type NotificationKind,
  type ReminderCadence,
} from "@/lib/notifications/archetypes";
import { dispatchNotification } from "@/lib/notifications/dispatch";
import { resolveOwners } from "@/lib/notifications/resolve-owners";
import { DEFAULT_ACCOUNT_MANAGER } from "@/lib/team";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface ReminderRow {
  subject_type: string;
  subject_id: string;
  recipient_id: string;
  kind: string;
  last_sent_at: string;
  escalation_level: number;
}

function authed(request: Request): boolean {
  const cronHeader = request.headers.get("x-vercel-cron");
  if (cronHeader) return true;
  const auth = request.headers.get("authorization");
  if (!auth) return false;
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return auth === `Bearer ${secret}`;
}

interface StaleSubject {
  kind: NotificationKind;
  subjectType: string;
  subjectId: string;
  /** Anchor date used to compute staleness against the cadence. */
  anchor: string;
  /** Context bag forwarded to the dispatcher. */
  context: Record<string, string | number | null | undefined>;
}

type SupabaseClient = ReturnType<typeof getServiceRoleClient>;

/**
 * Collect every subject that *could* warrant a nudge for a given
 * archetype. We deliberately keep these predicates short-form rather than
 * a generic engine — the set of archetypes is bounded and each predicate
 * is obvious at the call site.
 */
async function findStaleSubjects(
  supabase: SupabaseClient,
  kind: NotificationKind
): Promise<StaleSubject[]> {
  switch (kind) {
    case "asset.review_needed": {
      const { data } = await supabase
        .from("assets")
        .select(
          "id, event_id, name, updated_at, events(name), uploader:profiles!assets_uploaded_by_fkey(name)"
        )
        .eq("review_status", "pending_review")
        .not("file_url", "is", null);
      return ((data ?? []) as unknown as Record<string, unknown>[]).map(
        (r) => {
          const events = r.events as { name?: string } | null;
          const uploader = r.uploader as { name?: string } | null;
          return {
            kind,
            subjectType: "asset",
            subjectId: String(r.id),
            anchor: String(r.updated_at),
            context: {
              eventId: String(r.event_id),
              assetId: String(r.id),
              assetName: String(r.name),
              eventName: events?.name ?? "an upcoming event",
              contactName: uploader?.name ?? "A customer",
              entityType: "asset",
              entityId: String(r.id),
            },
          };
        }
      );
    }

    case "approval.requested": {
      const { data } = await supabase
        .from("approvals")
        .select("id, event_id, requested_at, events(name)")
        .eq("status", "pending");
      return ((data ?? []) as unknown as Record<string, unknown>[]).map(
        (r) => {
          const events = r.events as { name?: string } | null;
          return {
            kind,
            subjectType: "approval",
            subjectId: String(r.id),
            anchor: String(r.requested_at),
            context: {
              eventId: String(r.event_id),
              approvalId: String(r.id),
              eventName: events?.name ?? "your event",
              entityType: "approval",
              entityId: String(r.id),
            },
          };
        }
      );
    }

    case "asset.revision_requested": {
      const { data } = await supabase
        .from("assets")
        .select(
          "id, event_id, name, review_decided_at, review_feedback, events(name)"
        )
        .eq("review_status", "revision_requested");
      return ((data ?? []) as unknown as Record<string, unknown>[]).map(
        (r) => {
          const events = r.events as { name?: string } | null;
          return {
            kind,
            subjectType: "asset",
            subjectId: String(r.id),
            anchor: String(r.review_decided_at ?? r.updated_at ?? ""),
            context: {
              eventId: String(r.event_id),
              assetId: String(r.id),
              assetName: String(r.name),
              eventName: events?.name ?? "your event",
              feedback: (r.review_feedback as string) ?? "",
              entityType: "asset",
              entityId: String(r.id),
            },
          };
        }
      );
    }

    case "briefing.needed": {
      const { data } = await supabase
        .from("briefing_responses")
        .select("event_id, form_type, updated_at, is_submitted, events(name)")
        .eq("is_submitted", false);
      return ((data ?? []) as unknown as Record<string, unknown>[]).map(
        (r) => {
          const events = r.events as { name?: string } | null;
          return {
            kind,
            subjectType: "briefing",
            subjectId: String(r.event_id),
            anchor: String(r.updated_at),
            context: {
              eventId: String(r.event_id),
              eventName: events?.name ?? "your event",
              entityType: "briefing_response",
              entityId: String(r.event_id),
            },
          };
        }
      );
    }

    case "proposal.delivered": {
      const { data } = await supabase
        .from("quotes")
        .select("id, contact_name, company_name, updated_at")
        .eq("status", "proposal_sent");
      return ((data ?? []) as unknown as Record<string, unknown>[]).map(
        (r) => ({
          kind,
          subjectType: "quote",
          subjectId: String(r.id),
          anchor: String(r.updated_at),
          context: {
            quoteId: String(r.id),
            contactName: String(r.contact_name),
            eventName: (r.company_name as string) ?? "your event",
            entityType: "quote",
            entityId: String(r.id),
          },
        })
      );
    }

    case "proposal.intake_received": {
      const { data } = await supabase
        .from("quotes")
        .select("id, contact_name, created_at")
        .eq("status", "submitted")
        .eq("track", "proposal");
      return ((data ?? []) as unknown as Record<string, unknown>[]).map(
        (r) => ({
          kind,
          subjectType: "quote",
          subjectId: String(r.id),
          anchor: String(r.created_at),
          context: {
            quoteId: String(r.id),
            contactName: String(r.contact_name),
            entityType: "quote",
            entityId: String(r.id),
          },
        })
      );
    }

    case "task.overdue": {
      const today = new Date().toISOString().slice(0, 10);
      const { data } = await supabase
        .from("tasks")
        .select("id, event_id, title, due_date, status")
        .not("status", "in", '("complete","skipped")')
        .not("due_date", "is", null)
        .lt("due_date", today);
      return ((data ?? []) as unknown as Record<string, unknown>[]).map(
        (r) => ({
          kind,
          subjectType: "task",
          subjectId: String(r.id),
          anchor: String(r.due_date),
          context: {
            eventId: String(r.event_id),
            taskId: String(r.id),
            taskTitle: String(r.title),
            dueDate: String(r.due_date),
            entityType: "task",
            entityId: String(r.id),
          },
        })
      );
    }

    case "studio.request_submitted": {
      const { data } = await supabase
        .from("studio_requests")
        .select("id, event_id, title, service_type, created_at")
        .in("status", ["submitted", "draft"]);
      return ((data ?? []) as unknown as Record<string, unknown>[]).map(
        (r) => ({
          kind,
          subjectType: "studio_request",
          subjectId: String(r.id),
          anchor: String(r.created_at),
          context: {
            eventId: String(r.event_id),
            studioRequestId: String(r.id),
            title: String(r.title),
            serviceType: String(r.service_type),
            entityType: "studio_request",
            entityId: String(r.id),
          },
        })
      );
    }

    default:
      return [];
  }
}

function hoursSince(iso: string): number {
  if (!iso) return 0;
  const now = Date.now();
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return 0;
  return (now - then) / (1000 * 60 * 60);
}

async function nudgeStale(
  supabase: SupabaseClient,
  kind: NotificationKind,
  cadence: ReminderCadence
): Promise<{ sent: number; skipped: number }> {
  const subjects = await findStaleSubjects(supabase, kind);
  let sent = 0;
  let skipped = 0;
  const archetype = ARCHETYPES[kind];

  for (const subject of subjects) {
    const age = hoursSince(subject.anchor);
    if (age < cadence.firstAfterHours) {
      skipped += 1;
      continue;
    }

    const recipients = await resolveOwners(
      archetype,
      { ...subject.context, supabase: undefined } as Parameters<typeof resolveOwners>[1],
      supabase
    );
    const realRecipients = recipients.filter((r) => !r.isFallbackTeamInbox);

    for (const recipient of realRecipients) {
      const { data: ledgerRaw } = await supabase
        .from("notification_reminders")
        .select("escalation_level, last_sent_at")
        .eq("subject_type", subject.subjectType)
        .eq("subject_id", subject.subjectId)
        .eq("recipient_id", recipient.id)
        .eq("kind", kind)
        .maybeSingle();
      const ledger = ledgerRaw as
        | { escalation_level: number; last_sent_at: string }
        | null;

      const currentLevel = ledger?.escalation_level ?? 0;
      const lastSent = ledger?.last_sent_at;
      if (currentLevel >= cadence.maxEscalations) {
        skipped += 1;
        continue;
      }
      if (lastSent && hoursSince(lastSent) < cadence.intervalHours) {
        skipped += 1;
        continue;
      }

      const nextLevel = currentLevel + 1;
      const overrideEmailOff =
        archetype.classOf === "action_required" && nextLevel >= 2;
      const ccAE =
        cadence.ccAccountManagerAtLevel != null &&
        nextLevel >= cadence.ccAccountManagerAtLevel
          ? [DEFAULT_ACCOUNT_MANAGER.email]
          : undefined;

      await dispatchNotification(kind, subject.context, {
        supabaseClient: supabase,
        reminder: {
          isReminder: true,
          escalationLevel: nextLevel,
          overrideEmailOff,
          ccEmails: ccAE,
        },
        // The in-portal row was already written when the subject originated;
        // reminders are an email-only nudge so we don't pile up duplicate
        // bell entries for the same subject.
        skipInPortal: true,
      });

      await supabase
        .from("notification_reminders")
        .upsert({
          subject_type: subject.subjectType,
          subject_id: subject.subjectId,
          recipient_id: recipient.id,
          kind,
          last_sent_at: new Date().toISOString(),
          escalation_level: nextLevel,
        });
      sent += 1;
    }
  }

  return { sent, skipped };
}

/**
 * Time-driven event nudges (t-30/14/7/3). Targets every event whose
 * `event_date_start` falls within ±1 day of the offset.
 */
async function nudgeTimeDriven(
  supabase: SupabaseClient
): Promise<{ sent: number }> {
  const archetypes: { kind: NotificationKind; offsetDays: number }[] = [
    { kind: "event.t_minus_30", offsetDays: 30 },
    { kind: "event.t_minus_14", offsetDays: 14 },
    { kind: "event.t_minus_7", offsetDays: 7 },
    { kind: "event.t_minus_3", offsetDays: 3 },
  ];
  let sent = 0;
  for (const { kind, offsetDays } of archetypes) {
    const target = new Date();
    target.setUTCDate(target.getUTCDate() + offsetDays);
    const targetDate = target.toISOString().slice(0, 10);
    const { data: events } = await supabase
      .from("events")
      .select("id, name, event_date_start")
      .eq("event_date_start", targetDate);
    for (const e of events ?? []) {
      const row = e as Record<string, unknown>;
      const eventId = String(row.id);
      const eventName = String(row.name);

      const { data: alreadySent } = await supabase
        .from("notifications")
        .select("id")
        .eq("event_id", eventId)
        .eq("kind", kind)
        .limit(1)
        .maybeSingle();
      if (alreadySent) continue;

      await dispatchNotification(
        kind,
        {
          eventId,
          eventName,
          entityType: "event",
          entityId: eventId,
        },
        { supabaseClient: supabase }
      );
      sent += 1;
    }
  }
  return { sent };
}

export async function GET(request: Request) {
  if (!authed(request)) {
    return NextResponse.json({ error: "unauthorised" }, { status: 401 });
  }

  let supabase: SupabaseClient;
  try {
    supabase = getServiceRoleClient();
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "service role not configured" },
      { status: 500 }
    );
  }

  const summary: Record<string, { sent: number; skipped: number }> = {};

  for (const archetype of Object.values(ARCHETYPES)) {
    if (!archetype.reminderCadence) continue;
    if (archetype.kind.startsWith("event.t_minus_")) continue;
    try {
      summary[archetype.kind] = await nudgeStale(
        supabase,
        archetype.kind,
        archetype.reminderCadence
      );
    } catch (e) {
      console.error(`[Cron] ${archetype.kind} failed`, e);
      summary[archetype.kind] = { sent: 0, skipped: 0 };
    }
  }

  const timeDriven = await nudgeTimeDriven(supabase);

  return NextResponse.json({
    ok: true,
    ranAt: new Date().toISOString(),
    reminders: summary,
    timeDriven,
  });
}
