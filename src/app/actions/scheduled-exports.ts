"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireInternalUser } from "@/lib/auth";
import { getUser } from "@/lib/auth";
import { isInternalRole } from "@/lib/roles";
import { getServiceRoleClient } from "@/lib/supabase/service-role";
import { toCsv } from "@/lib/exports/csv";
import { buildWorkbook } from "@/lib/exports/excel";

export type ExportFrequency = "daily" | "weekly" | "end_of_event" | "on_demand";
export type ExportFormat = "csv" | "excel" | "pdf";
export type ExportField = "leads" | "scores" | "metrics" | "custom_fields";

export interface ScheduledExport {
  id: string;
  eventId: string;
  frequency: ExportFrequency;
  format: ExportFormat;
  includeFields: ExportField[];
  recipients: string[];
  isActive: boolean;
  lastSentAt: string | null;
  nextSendAt: string | null;
  createdAt: string;
}

function mapExport(row: Record<string, unknown>): ScheduledExport {
  return {
    id: row.id as string,
    eventId: row.event_id as string,
    frequency: row.frequency as ExportFrequency,
    format: row.format as ExportFormat,
    includeFields: (row.include_fields ?? []) as ExportField[],
    recipients: (row.recipients ?? []) as string[],
    isActive: row.is_active as boolean,
    lastSentAt: (row.last_sent_at as string) ?? null,
    nextSendAt: (row.next_send_at as string) ?? null,
    createdAt: row.created_at as string,
  };
}

export async function getScheduledExports(eventId: string): Promise<ScheduledExport[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("scheduled_exports")
    .select("*")
    .eq("event_id", eventId)
    .order("created_at", { ascending: false });

  return (data ?? []).map((r) => mapExport(r as Record<string, unknown>));
}

function computeNextSend(frequency: ExportFrequency): string | null {
  const now = new Date();
  switch (frequency) {
    case "daily": {
      const next = new Date(now);
      next.setDate(next.getDate() + 1);
      next.setHours(7, 0, 0, 0);
      return next.toISOString();
    }
    case "weekly": {
      const next = new Date(now);
      next.setDate(next.getDate() + (7 - next.getDay()) % 7 + 1);
      next.setHours(7, 0, 0, 0);
      return next.toISOString();
    }
    default:
      return null;
  }
}

export async function createScheduledExport(
  eventId: string,
  config: {
    frequency: ExportFrequency;
    format: ExportFormat;
    includeFields: ExportField[];
    recipients: string[];
  }
): Promise<{ success: boolean; error?: string }> {
  const user = await getUser();
  if (!user) return { success: false, error: "Not authenticated" };
  if (!isInternalRole(user.role)) {
    return { success: false, error: "Only internal staff can schedule exports." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("scheduled_exports").insert({
    event_id: eventId,
    created_by: user.id,
    frequency: config.frequency,
    format: config.format,
    include_fields: config.includeFields,
    recipients: config.recipients,
    is_active: true,
    next_send_at: computeNextSend(config.frequency),
  });

  if (error) return { success: false, error: error.message };
  revalidatePath(`/events/${eventId}/reports`);
  return { success: true };
}

export async function toggleScheduledExport(
  exportId: string,
  isActive: boolean
): Promise<{ success: boolean; error?: string }> {
  await requireInternalUser();
  const supabase = await createClient();
  const { error } = await supabase
    .from("scheduled_exports")
    .update({ is_active: isActive, updated_at: new Date().toISOString() })
    .eq("id", exportId);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function deleteScheduledExport(
  exportId: string
): Promise<{ success: boolean; error?: string }> {
  await requireInternalUser();
  const supabase = await createClient();
  const { error } = await supabase
    .from("scheduled_exports")
    .delete()
    .eq("id", exportId);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

/** Build export data for a given event and fields. */
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
      .from("event_leads")
      .select("*")
      .eq("event_id", eventId)
      .order("created_at");
    const rows = (leads ?? []) as Record<string, unknown>[];
    sheets.push({
      name: "Leads",
      columns: [
        { header: "Name", key: "name", width: 24 },
        { header: "Email", key: "email", width: 28 },
        { header: "Phone", key: "phone", width: 16 },
        { header: "Company", key: "company", width: 22 },
        { header: "Captured At", key: "created_at", width: 20 },
      ],
      rows,
    });
  }

  if (includeFields.includes("scores")) {
    const { data: scores } = await supabase
      .from("event_game_scores")
      .select("*")
      .eq("event_id", eventId)
      .order("score", { ascending: false });
    const rows = (scores ?? []) as Record<string, unknown>[];
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
      .from("event_leads")
      .select("name, email, custom_fields_json")
      .eq("event_id", eventId)
      .order("created_at");
    const raw = (leads ?? []) as Record<string, unknown>[];
    const rows = raw.map((r) => ({
      name: r.name,
      email: r.email,
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

/** Execute an export and upload to storage, returning a signed URL. */
export async function executeExportNow(
  exportId: string
): Promise<{ success: boolean; url?: string; error?: string }> {
  const supabase = getServiceRoleClient();
  const { data: exp } = await supabase
    .from("scheduled_exports")
    .select("*")
    .eq("id", exportId)
    .single();

  if (!exp) return { success: false, error: "Export not found" };

  const row = exp as Record<string, unknown>;
  const eventId = row.event_id as string;
  const includeFields = (row.include_fields ?? []) as ExportField[];
  const format = row.format as ExportFormat;

  const { filename, data } = await buildExportData(eventId, includeFields, format);

  const storagePath = `exports/${eventId}/${filename}`;
  const bucket = "reports";
  const fileData = typeof data === "string" ? new TextEncoder().encode(data) : data;

  const { error: uploadErr } = await supabase.storage
    .from(bucket)
    .upload(storagePath, fileData, { upsert: true });

  if (uploadErr) return { success: false, error: `Upload failed: ${uploadErr.message}` };

  const { data: signed } = await supabase.storage
    .from(bucket)
    .createSignedUrl(storagePath, 7 * 24 * 60 * 60);

  await supabase
    .from("scheduled_exports")
    .update({
      last_sent_at: new Date().toISOString(),
      next_send_at: computeNextSend(row.frequency as ExportFrequency),
    })
    .eq("id", exportId);

  return { success: true, url: signed?.signedUrl ?? undefined };
}
