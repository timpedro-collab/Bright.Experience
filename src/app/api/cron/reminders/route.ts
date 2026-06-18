/**
 * Reminder cron — daily 09:00 UTC.
 *
 * Scans the small, well-known set of "could be stuck" subjects and dispatches
 * re-nudges via the notification spine. Every send is recorded in
 * `notification_reminders` so the cron never duplicates a nudge inside the
 * cadence window. The engine lives in `@/lib/notifications/reminders`; this
 * route only handles auth and orchestration.
 *
 * Class A archetypes get an email-mode override at the second escalation
 * level: even if the recipient has set `email_mode: "off"` for that archetype,
 * the cron will re-email them. That's the guardrail promised on
 * `/settings/notifications` and the reason action items can't actually stall
 * the project.
 *
 * Auth: `Authorization: Bearer ${CRON_SECRET}` (see lib/cron-auth).
 */

import { NextResponse } from "next/server";

import { getServiceRoleClient } from "@/lib/supabase/service-role";
import { requireCron } from "@/lib/cron-auth";
import {
  runStaleReminders,
  nudgeTimeDriven,
  escalateOverdueDeadlines,
  transitionOverdueInvoices,
  warnExpiringCompliance,
  type ReminderClient,
} from "@/lib/notifications/reminders";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!requireCron(request)) {
    return NextResponse.json({ error: "unauthorised" }, { status: 401 });
  }

  let supabase: ReminderClient;
  try {
    supabase = getServiceRoleClient();
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "service role not configured" },
      { status: 500 }
    );
  }

  const reminders = await runStaleReminders(supabase);
  const invoiceOverdue = await transitionOverdueInvoices(supabase);
  const complianceExpiry = await warnExpiringCompliance(supabase);
  const timeDriven = await nudgeTimeDriven(supabase);
  const deadlineEscalation = await escalateOverdueDeadlines(supabase);

  return NextResponse.json({
    ok: true,
    ranAt: new Date().toISOString(),
    reminders,
    timeDriven,
    deadlineEscalation,
    invoiceOverdue,
    complianceExpiry,
  });
}
