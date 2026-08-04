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
import { requireCron } from "@/lib/cron-auth";
import { recordCronRun } from "@/lib/cron/heartbeat";
import { generateEventReportSystem } from "@/server/reports";
import { refreshCampaignsForEvent } from "@/server/campaign-rollup";
import { dispatchNotification } from "@/lib/notifications/dispatch";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!requireCron(request)) {
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
    await recordCronRun(supabase, "reports", "error", {
      stage: "candidate_query",
      message: queryErr.message,
    });
    return NextResponse.json({ error: "query failed" }, { status: 500 });
  }

  const events = (candidates ?? []).filter(
    (e: { id: string }) => !reportedIds.has(e.id)
  );

  if (events.length === 0) {
    await recordCronRun(supabase, "reports", "ok", { generated: 0 });
    return NextResponse.json({ ok: true, generated: 0 });
  }

  let generated = 0;
  // Individual failures are logged and skipped so one bad event doesn't stop
  // the batch, but they still have to colour the heartbeat.
  let failures = 0;

  for (const event of events) {
    try {
      const result = await generateEventReportSystem(event.id as string);
      if (result.success) {
        generated += 1;

        // Campaign dashboards read a precomputed rollup; a fresh report is
        // the natural moment to fold this event's finals into it.
        await refreshCampaignsForEvent(event.id as string).catch((err) =>
          console.error(`[Cron:reports] campaign rollup failed for ${event.id}`, err)
        );

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
        failures += 1;
        console.error(`[Cron:reports] generation failed for ${event.id}`, result.error);
      }
    } catch (err) {
      failures += 1;
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
        const { buildExportData } = await import("@/server/exports");
        const includeFields = (exp.include_fields ?? []) as ("leads" | "scores" | "metrics" | "custom_fields")[];
        const format = exp.format as "csv" | "excel" | "pdf";
        const eventId = exp.event_id as string;

        const { filename, data } = await buildExportData(eventId, includeFields, format);
        // Event id first — the storage policies scope reads by owning event.
        const storagePath = `${eventId}/exports/${filename}`;
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
        failures += 1;
        console.error(`[Cron:reports] export ${exp.id} failed`, exportErr);
        Sentry.captureException(exportErr, { tags: { cron: "scheduled_export", exportId: exp.id as string } });
      }
    }
  } catch (exportsErr) {
    failures += 1;
    console.error("[Cron:reports] scheduled exports sweep failed", exportsErr);
  }

  await recordCronRun(supabase, "reports", failures > 0 ? "error" : "ok", {
    generated,
    exportsSent,
    failures,
  });

  return NextResponse.json({ ok: true, generated, exportsSent });
}
