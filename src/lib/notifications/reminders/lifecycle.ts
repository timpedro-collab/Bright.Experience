/**
 * Time- and state-driven cron tasks that run alongside the stale-subject
 * nudges: countdown nudges, deadline escalation, invoice overdue transitions,
 * and compliance expiry warnings.
 */

import { type NotificationKind } from "@/lib/notifications/archetypes";
import { dispatchNotification } from "@/lib/notifications/dispatch";
import type { ReminderClient } from "./client";

/**
 * Graduated deadline escalation — auto-flags event health to amber when
 * any blocking deadline is 3+ days overdue.
 */
export async function escalateOverdueDeadlines(
  supabase: ReminderClient
): Promise<{ escalated: number; notified: number }> {
  const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);

  const { data: overdueTasks } = await supabase
    .from("tasks")
    .select("id, event_id, title, due_date, events(name)")
    .not("status", "in", '("complete","skipped")')
    .not("due_date", "is", null)
    .lt("due_date", threeDaysAgo);

  const eventIds = new Set<string>();
  let notified = 0;

  for (const t of overdueTasks ?? []) {
    eventIds.add(t.event_id);
    const row = t as Record<string, unknown>;
    const events = row.events as { name?: string } | null;
    const dueDate = row.due_date as string;
    const daysOverdue = Math.floor(
      (Date.now() - new Date(dueDate).getTime()) / (1000 * 60 * 60 * 24)
    );

    try {
      await dispatchNotification(
        "deadline.escalation",
        {
          eventId: t.event_id as string,
          eventName: events?.name ?? "an event",
          taskTitle: t.title as string,
          dueDate,
          daysOverdue: String(daysOverdue),
          entityType: "task",
          entityId: t.id as string,
        },
        { supabaseClient: supabase }
      );
      notified += 1;
    } catch {
      // dispatch failures shouldn't block the rest
    }
  }

  let escalated = 0;
  for (const eid of eventIds) {
    const { data: event } = await supabase
      .from("events")
      .select("health_status")
      .eq("id", eid)
      .single();

    if (event?.health_status === "green") {
      await supabase
        .from("events")
        .update({ health_status: "amber" })
        .eq("id", eid);
      escalated += 1;
    }
  }

  return { escalated, notified };
}

/**
 * Time-driven event nudges (t-30/14/7/3). Targets every event whose
 * `event_date_start` falls within ±1 day of the offset.
 */
export async function nudgeTimeDriven(
  supabase: ReminderClient
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

/** Auto-transition invoices from `issued` to `overdue` and notify. */
export async function transitionOverdueInvoices(
  supabase: ReminderClient
): Promise<{ count: number }> {
  try {
    const now = new Date().toISOString();
    const { data: transitioned } = await supabase
      .from("invoices")
      .update({ status: "overdue", updated_at: now })
      .eq("status", "issued")
      .lt("due_at", now)
      .select("id, invoice_number, event_id, events(name)");

    for (const inv of transitioned ?? []) {
      const row = inv as Record<string, unknown>;
      const events = row.events as { name?: string } | null;
      await dispatchNotification("invoice.overdue", {
        eventId: String(row.event_id),
        invoiceNumber: String(row.invoice_number),
        eventName: events?.name ?? "an event",
        entityType: "invoice",
        entityId: String(row.id),
      }, { supabaseClient: supabase }).catch(() => {});
    }

    return { count: transitioned?.length ?? 0 };
  } catch (e) {
    console.error("[Cron] invoice overdue transition failed", e);
    return { count: 0 };
  }
}

/** Compliance document expiry warnings (30 days out). */
export async function warnExpiringCompliance(
  supabase: ReminderClient
): Promise<{ notified: number }> {
  const result = { notified: 0 };
  try {
    const thirtyDaysOut = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    const { data: expiring } = await supabase
      .from("compliance_documents")
      .select("id, event_id, title, expires_at, events(name)")
      .eq("status", "approved")
      .not("expires_at", "is", null)
      .lt("expires_at", thirtyDaysOut);

    for (const doc of (expiring ?? []) as Record<string, unknown>[]) {
      const events = doc.events as { name?: string } | null;
      await dispatchNotification("compliance.document_expiring", {
        eventId: String(doc.event_id),
        eventName: events?.name ?? "an event",
        documentTitle: String(doc.title),
        expiryDate: String(doc.expires_at),
        entityType: "compliance_document",
        entityId: String(doc.id),
      }, { supabaseClient: supabase }).catch(() => {});
      result.notified += 1;
    }
  } catch (e) {
    console.error("[Cron] compliance expiry check failed", e);
  }
  return result;
}
