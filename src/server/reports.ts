/**
 * Report generation internals.
 *
 * Server-only, not a Server Action. The system variant runs on the service role
 * and takes an arbitrary event id, so exporting it from a `"use server"` module
 * made "generate a report for any event" a public endpoint. The reports cron is
 * the only caller of the system path and authorises via `requireCron`.
 */
import "server-only";

import { revalidatePath } from "next/cache";

import { getServiceRoleClient } from "@/lib/supabase/service-role";
import { getPostShowReport } from "@/lib/brightblue/client";
import {
  buildSponsorProof,
  type SponsorSlotRow,
  type SponsorTelemetryRow,
} from "@/lib/reports/sponsor-proof";

/**
 * Service-role report generation — used by the reports cron, where there is no
 * authenticated user in the request context.
 */
export async function generateEventReportSystem(eventId: string) {
  return generateEventReportInternal(eventId, getServiceRoleClient());
}

/**
 * Shared implementation for both authenticated and system-level report
 * generation. The caller supplies the client, which is what decides whether the
 * read is RLS-scoped or privileged.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function generateEventReportInternal(eventId: string, supabase: any) {
  const { data: event, error: eventErr } = await supabase
    .from("events")
    .select("id, name, event_type, machine_type, account_id")
    .eq("id", eventId)
    .single();

  if (eventErr || !event) {
    return { success: false as const, error: "Event not found" };
  }

  const { data: snapshots } = await supabase
    .from("event_metrics_snapshot")
    .select("*")
    .eq("event_id", eventId)
    .order("snapshot_date");

  let totalPlays = snapshots?.reduce((s: number, r: Record<string, unknown>) => s + ((r.total_plays as number) ?? 0), 0) ?? 0;
  let totalInteractions = snapshots?.reduce((s: number, r: Record<string, unknown>) => s + ((r.total_interactions as number) ?? 0), 0) ?? 0;
  let totalLeads = snapshots?.reduce((s: number, r: Record<string, unknown>) => s + ((r.total_leads as number) ?? 0), 0) ?? 0;
  let totalPrizes = snapshots?.reduce((s: number, r: Record<string, unknown>) => s + ((r.total_prizes as number) ?? 0), 0) ?? 0;

  const dwellValues = snapshots
    ?.map((r: Record<string, unknown>) => Number(r.avg_dwell_time))
    .filter((v: number) => !Number.isNaN(v) && v > 0) ?? [];
  let avgDwellTime =
    dwellValues.length > 0
      ? dwellValues.reduce((a: number, b: number) => a + b, 0) / dwellValues.length
      : null;

  // Resilience: if the live webhook never delivered metrics, pull the final
  // post-show report straight from Bright.Blue Cloud and persist a snapshot so
  // the report (and benchmarks) aren't empty. No-ops when Cloud isn't configured.
  if (totalPlays + totalInteractions + totalLeads + totalPrizes === 0) {
    const cloud = await getPostShowReport(eventId);
    if (cloud) {
      totalPlays = cloud.total_plays ?? 0;
      totalInteractions = cloud.total_interactions ?? 0;
      totalLeads = cloud.total_leads ?? 0;
      totalPrizes = cloud.total_prizes ?? 0;
      avgDwellTime = cloud.avg_dwell_time ?? avgDwellTime;

      await supabase.from("event_metrics_snapshot").upsert(
        {
          event_id: eventId,
          snapshot_date: new Date().toISOString().slice(0, 10),
          total_plays: totalPlays,
          total_interactions: totalInteractions,
          total_leads: totalLeads,
          total_prizes: totalPrizes,
          avg_dwell_time: avgDwellTime ?? 0,
          is_final: true,
        },
        { onConflict: "event_id,snapshot_date" },
      );
    }
  }

  const metricsJson: Record<string, unknown> = {
    totalPlays,
    totalInteractions,
    totalLeads,
    totalPrizes,
    avgDwellTime,
    snapshotCount: snapshots?.length ?? 0,
  };

  // Capture-quality proof: how many junk entries the machine turned away
  // (business-emails-only rejections + duplicate blocks). Streamed as
  // telemetry event types by the machine capture flow; zero rows for events
  // that predate the guardrails, in which case the section is omitted.
  const [rejectedRes, duplicateRes] = await Promise.all([
    supabase
      .from("telemetry_events")
      .select("id", { count: "exact", head: true })
      .eq("event_id", eventId)
      .eq("event_type", "capture_rejected_domain"),
    supabase
      .from("telemetry_events")
      .select("id", { count: "exact", head: true })
      .eq("event_id", eventId)
      .eq("event_type", "capture_duplicate_blocked"),
  ]);
  const rejectedDomains = rejectedRes.count ?? 0;
  const duplicatesBlocked = duplicateRes.count ?? 0;
  if (rejectedDomains > 0 || duplicatesBlocked > 0) {
    metricsJson.captureQuality = { rejectedDomains, duplicatesBlocked };
  }

  // Per-sponsor proof: on an organizer's show each sold slot is one machine
  // for one date range, so a sponsor gets its own numbers rather than the
  // show total. Omitted entirely for shows with no sponsor inventory.
  const { data: slots } = await supabase
    .from("sponsorship_slots")
    .select(
      `id, sponsor_name, machine_instance_id, start_date, end_date, status,
       machine_instances ( serial_number, nickname, zone )`,
    )
    .eq("event_id", eventId);

  if (slots?.length) {
    const { data: slotTelemetry } = await supabase
      .from("telemetry_events")
      .select("event_type, timestamp, machine_instance_id")
      .eq("event_id", eventId)
      .not("machine_instance_id", "is", null);

    const sponsors = buildSponsorProof(
      slots as SponsorSlotRow[],
      (slotTelemetry ?? []) as SponsorTelemetryRow[],
    );
    if (sponsors.length > 0) metricsJson.sponsors = sponsors;
  }

  let predictionsJson: Record<string, unknown> = {};
  let comparisonJson: Record<string, unknown> = {};

  const { data: quote } = await supabase
    .from("quotes")
    .select("outcome_estimates_json, estimated_interactions, estimated_leads, estimated_impressions")
    .eq("event_id", eventId)
    .limit(1)
    .maybeSingle();

  if (quote) {
    const estimates = (quote.outcome_estimates_json ?? {}) as Record<string, unknown>;
    const estInteractions = (quote.estimated_interactions ?? estimates.interactions ?? null) as number | null;
    const estLeads = (quote.estimated_leads ?? estimates.leads ?? null) as number | null;

    predictionsJson = {
      estimatedInteractions: estInteractions,
      estimatedLeads: estLeads,
      estimatedImpressions: quote.estimated_impressions ?? estimates.impressions ?? null,
      raw: estimates,
    };

    comparisonJson = {
      interactions: {
        predicted: estInteractions,
        actual: totalInteractions,
        delta: estInteractions != null ? totalInteractions - estInteractions : null,
      },
      leads: {
        predicted: estLeads,
        actual: totalLeads,
        delta: estLeads != null ? totalLeads - estLeads : null,
      },
    };
  }

  const { data: report, error: insertErr } = await supabase
    .from("event_reports")
    .insert({
      event_id: eventId,
      report_type: "post_event",
      title: `Post-Event Report — ${event.name}`,
      metrics_json: metricsJson,
      predictions_json: predictionsJson,
      comparison_json: comparisonJson,
      highlights_json: [],
      is_published: false,
    })
    .select("id")
    .single();

  if (insertErr || !report) {
    return { success: false as const, error: "Failed to generate report" };
  }

  revalidatePath(`/events/${eventId}/reports`);
  revalidatePath("/admin/reports");
  return { success: true as const, data: { id: report.id } };
}
