/**
 * Auto-generate post-event reports cron.
 *
 * Finds events whose `event_date_end` has passed by 24+ hours and that
 * have no `event_reports` row yet, generates a draft report for each,
 * and notifies the internal team so they can review before publishing.
 */

import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";

import { getServiceRoleClient } from "@/lib/supabase/service-role";
import { generateEventReportSystem } from "@/app/actions/reports";
import { dispatchNotification } from "@/lib/notifications/dispatch";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function authed(request: Request): boolean {
  if (request.headers.get("x-vercel-cron")) return true;
  const auth = request.headers.get("authorization");
  if (!auth) return false;
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return auth === `Bearer ${secret}`;
}

export async function GET(request: Request) {
  if (!authed(request)) {
    return NextResponse.json({ error: "unauthorised" }, { status: 401 });
  }

  const supabase = getServiceRoleClient();

  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  // Collect event IDs that already have a report so we can exclude them.
  const { data: existingReports } = await supabase
    .from("event_reports")
    .select("event_id");
  const reportedIds = new Set(
    (existingReports ?? []).map((r: { event_id: string }) => r.event_id)
  );

  // Events that ended 24+ hours ago.
  const { data: candidates, error: queryErr } = await supabase
    .from("events")
    .select("id, name")
    .not("event_date_end", "is", null)
    .lt("event_date_end", cutoff);

  if (queryErr) {
    console.error("[Cron:reports] query failed", queryErr);
    return NextResponse.json({ error: "query failed" }, { status: 500 });
  }

  const events = (candidates ?? []).filter(
    (e: { id: string }) => !reportedIds.has(e.id)
  );

  if (events.length === 0) {
    return NextResponse.json({ ok: true, generated: 0 });
  }

  let generated = 0;

  for (const event of events) {
    try {
      const result = await generateEventReportSystem(event.id as string);
      if (result.success) {
        generated += 1;

        try {
          await dispatchNotification(
            "report.draft_ready",
            {
              eventId: event.id as string,
              eventName: event.name as string,
              entityType: "event_report",
              entityId: event.id as string,
            },
            { supabaseClient: supabase }
          );
        } catch (notifyErr) {
          console.error(`[Cron:reports] notification failed for ${event.id}`, notifyErr);
        }
      } else {
        console.error(`[Cron:reports] generation failed for ${event.id}`, result.error);
      }
    } catch (err) {
      Sentry.captureException(err, {
        tags: { cron: "reports", eventId: event.id as string },
      });
      console.error(`[Cron:reports] error for ${event.id}`, err);
    }
  }

  // --- Process scheduled exports ---
  let exportsSent = 0;
  try {
    const now = new Date().toISOString();
    const { data: dueExports } = await supabase
      .from("scheduled_exports")
      .select("id, event_id, include_fields, format, recipients, frequency")
      .eq("is_active", true)
      .lte("next_send_at", now);

    for (const exp of (dueExports ?? []) as Record<string, unknown>[]) {
      try {
        const { buildExportData } = await import("@/app/actions/scheduled-exports");
        const includeFields = (exp.include_fields ?? []) as ("leads" | "scores" | "metrics" | "custom_fields")[];
        const format = exp.format as "csv" | "excel" | "pdf";
        const eventId = exp.event_id as string;

        const { filename, data } = await buildExportData(eventId, includeFields, format);
        const storagePath = `exports/${eventId}/${filename}`;
        const fileData = typeof data === "string" ? new TextEncoder().encode(data) : data;

        await supabase.storage.from("reports").upload(storagePath, fileData, { upsert: true });

        const { data: signedUrlData } = await supabase.storage
          .from("reports")
          .createSignedUrl(storagePath, 7 * 24 * 60 * 60);
        const downloadUrl = signedUrlData?.signedUrl ?? "";

        const recipients = (exp.recipients ?? []) as string[];
        if (recipients.length > 0 && downloadUrl) {
          const { data: event } = await supabase
            .from("events")
            .select("name")
            .eq("id", exp.event_id)
            .single();
          const eventName = (event?.name as string) ?? "your event";

          for (const recipientEmail of recipients) {
            const { data: profile } = await supabase
              .from("profiles")
              .select("id")
              .eq("email", recipientEmail)
              .maybeSingle();

            if (profile?.id) {
              await dispatchNotification("report.scheduled_export_ready", {
                eventId: exp.event_id as string,
                eventName,
                recipientId: profile.id as string,
                filename,
                downloadUrl,
                entityType: "scheduled_export",
                entityId: exp.id as string,
              }, { supabaseClient: supabase }).catch(() => {});
            }
          }
        }

        const nextSend = (() => {
          const d = new Date();
          if (exp.frequency === "daily") { d.setDate(d.getDate() + 1); d.setHours(7, 0, 0, 0); }
          else if (exp.frequency === "weekly") { d.setDate(d.getDate() + 7); d.setHours(7, 0, 0, 0); }
          return d.toISOString();
        })();

        await supabase
          .from("scheduled_exports")
          .update({ last_sent_at: now, next_send_at: nextSend })
          .eq("id", exp.id);

        exportsSent += 1;
      } catch (exportErr) {
        console.error(`[Cron:reports] export ${exp.id} failed`, exportErr);
        Sentry.captureException(exportErr, { tags: { cron: "scheduled_export", exportId: exp.id as string } });
      }
    }
  } catch (exportsErr) {
    console.error("[Cron:reports] scheduled exports sweep failed", exportsErr);
  }

  return NextResponse.json({ ok: true, generated, exportsSent });
}
