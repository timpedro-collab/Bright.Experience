/**
 * Stale-subject nudging — the core re-nudge loop.
 *
 * `nudgeStale` walks one archetype's stale subjects, consults the
 * `notification_reminders` ledger so a nudge never fires inside its cadence
 * window, applies the Class-A email-off override + AE cc, and records each
 * send. `runStaleReminders` runs that across every archetype with a cadence.
 */

import * as Sentry from "@sentry/nextjs";

import {
  ARCHETYPES,
  type NotificationKind,
  type ReminderCadence,
} from "@/lib/notifications/archetypes";
import { dispatchNotification } from "@/lib/notifications/dispatch";
import { resolveOwners } from "@/lib/notifications/resolve-owners";
import { DEFAULT_ACCOUNT_MANAGER } from "@/lib/team";
import { findStaleSubjects } from "./stale-subjects";
import { hoursSince, type ReminderClient } from "./client";

export interface NudgeOutcome {
  sent: number;
  skipped: number;
}

export async function nudgeStale(
  supabase: ReminderClient,
  kind: NotificationKind,
  cadence: ReminderCadence
): Promise<NudgeOutcome> {
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
 * Run `nudgeStale` across every archetype that declares a cadence, skipping
 * the time-driven `event.t_minus_*` family (handled separately). A failure on
 * one archetype is captured and never blocks the rest.
 */
export async function runStaleReminders(
  supabase: ReminderClient
): Promise<Record<string, NudgeOutcome>> {
  const summary: Record<string, NudgeOutcome> = {};

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
      Sentry.captureException(e, { tags: { cron: "reminders", kind: archetype.kind } });
      console.error(`[Cron] ${archetype.kind} failed`, e);
      summary[archetype.kind] = { sent: 0, skipped: 0 };
    }
  }

  return summary;
}
