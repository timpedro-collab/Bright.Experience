/**
 * Export builders for scheduled and on-demand event exports.
 *
 * Server-only, not a Server Action. `buildExportData` reads every lead's name,
 * email and phone for an event with the service role, so exporting it from a
 * `"use server"` module made bulk PII exfiltration a single unauthenticated POST
 * away. Callers must authorise: `executeExportNow` checks internal role plus
 * event scope, and the exports cron authorises via `requireCron`.
 */
import "server-only";

import { getServiceRoleClient } from "@/lib/supabase/service-role";
import { toCsv } from "@/lib/exports/csv";
import { buildWorkbook } from "@/lib/exports/excel";
import type { ExportField, ExportFormat } from "@/lib/exports/types";

/**
 * Build the export payload for an event.
 *
 * @returns a filename and either a CSV string or an xlsx Buffer.
 */
export async function buildExportData(
  eventId: string,
  includeFields: ExportField[],
  format: ExportFormat
): Promise<{ filename: string; data: Buffer | string }> {
  const supabase = getServiceRoleClient();

  const { data: event } = await supabase
    .from("events")
    .select("name")
    .eq("id", eventId)
    .single();
  const eventName = (event?.name as string) ?? "Event";
  const dateSuffix = new Date().toISOString().slice(0, 10);

  const sheets: { name: string; columns: { header: string; key: string; width?: number }[]; rows: Record<string, unknown>[] }[] = [];

  if (includeFields.includes("leads")) {
    const { data: leads } = await supabase
      .from("leads")
      .select("contact_name, contact_email, contact_phone, source, captured_at")
      .eq("event_id", eventId)
      .order("captured_at");
    const rows = (leads ?? []) as Record<string, unknown>[];
    sheets.push({
      name: "Leads",
      columns: [
        { header: "Name", key: "contact_name", width: 24 },
        { header: "Email", key: "contact_email", width: 28 },
        { header: "Phone", key: "contact_phone", width: 16 },
        { header: "Source", key: "source", width: 16 },
        { header: "Captured At", key: "captured_at", width: 20 },
      ],
      rows,
    });
  }

  if (includeFields.includes("scores")) {
    // There's no dedicated scores table — game plays land in telemetry. Pull
    // completed plays and flatten the score/level out of the payload.
    const { data: plays } = await supabase
      .from("telemetry_events")
      .select("payload_json, timestamp")
      .eq("event_id", eventId)
      .eq("event_type", "play_completed")
      .order("timestamp", { ascending: false });
    const rows = ((plays ?? []) as Record<string, unknown>[]).map((p) => {
      const payload = (p.payload_json as Record<string, unknown>) ?? {};
      return {
        player_name: payload.player_name ?? payload.player ?? "—",
        score: payload.score ?? "",
        level_reached: payload.level_reached ?? payload.level ?? "",
        created_at: p.timestamp,
      };
    });
    sheets.push({
      name: "Game Scores",
      columns: [
        { header: "Player", key: "player_name", width: 22 },
        { header: "Score", key: "score", width: 12 },
        { header: "Level", key: "level_reached", width: 12 },
        { header: "Played At", key: "created_at", width: 20 },
      ],
      rows,
    });
  }

  if (includeFields.includes("metrics")) {
    const { data: snapshots } = await supabase
      .from("event_metrics_snapshot")
      .select("*")
      .eq("event_id", eventId)
      .order("snapshot_date");
    const rows = (snapshots ?? []) as Record<string, unknown>[];
    sheets.push({
      name: "Metrics",
      columns: [
        { header: "Date", key: "snapshot_date", width: 14 },
        { header: "Plays", key: "total_plays", width: 12 },
        { header: "Interactions", key: "total_interactions", width: 14 },
        { header: "Leads", key: "total_leads", width: 12 },
        { header: "Prizes", key: "total_prizes", width: 12 },
        { header: "Avg Dwell Time", key: "avg_dwell_time", width: 16 },
      ],
      rows,
    });
  }

  if (includeFields.includes("custom_fields")) {
    const { data: leads } = await supabase
      .from("leads")
      .select("contact_name, contact_email, custom_fields_json")
      .eq("event_id", eventId)
      .order("captured_at");
    const raw = (leads ?? []) as Record<string, unknown>[];
    const rows = raw.map((r) => ({
      name: r.contact_name,
      email: r.contact_email,
      ...((r.custom_fields_json as Record<string, unknown>) ?? {}),
    }));
    if (rows.length > 0) {
      const allKeys = [...new Set(rows.flatMap(Object.keys))];
      sheets.push({
        name: "Custom Fields",
        columns: allKeys.map((k) => ({ header: k, key: k, width: 18 })),
        rows,
      });
    }
  }

  if (sheets.length === 0) {
    sheets.push({
      name: "Export",
      columns: [{ header: "Note", key: "note" }],
      rows: [{ note: "No data available for selected fields." }],
    });
  }

  if (format === "excel") {
    const buf = await buildWorkbook(`${eventName} Export`, sheets);
    return { filename: `${eventName}-${dateSuffix}.xlsx`, data: buf };
  }

  const allRows = sheets.flatMap((s) => s.rows);
  const csv = toCsv(allRows);
  return { filename: `${eventName}-${dateSuffix}.csv`, data: csv };
}
