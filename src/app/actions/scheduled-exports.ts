"use server";

/**
 * Server actions for scheduled event exports.
 *
 * The payload builder itself lives in `src/server/exports.ts` — it reads lead
 * PII with the service role and must never be reachable as an RPC endpoint.
 */

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireInternalUser } from "@/lib/auth";
import { getUser } from "@/lib/auth";
import { isInternalRole } from "@/lib/roles";
import { getServiceRoleClient } from "@/lib/supabase/service-role";
import { buildExportData } from "@/server/exports";
import type {
  ExportField,
  ExportFormat,
  ExportFrequency,
  ScheduledExport,
} from "@/lib/exports/types";

// Straight from the source module — see the note in `invites.ts`: a local
// `export type { X }` in a "use server" file throws on module evaluation.
export type {
  ExportField,
  ExportFormat,
  ExportFrequency,
  ScheduledExport,
} from "@/lib/exports/types";

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

/**
 * Execute an export and upload to storage, returning a signed URL.
 *
 * Authorises twice: internal role, then read access to the export's event
 * through the RLS-scoped client. Without the second check any internal user
 * could dump the leads of an event they have no relationship with — and before
 * either check existed, so could an anonymous caller.
 */
export async function executeExportNow(
  exportId: string
): Promise<{ success: boolean; url?: string; error?: string }> {
  let scoped;
  try {
    ({ supabase: scoped } = await requireInternalUser());
  } catch {
    return { success: false, error: "Only internal staff can run exports." };
  }

  const supabase = getServiceRoleClient();
  const { data: exp } = await supabase
    .from("scheduled_exports")
    .select("*")
    .eq("id", exportId)
    .single();

  if (!exp) return { success: false, error: "Export not found" };

  const row = exp as Record<string, unknown>;
  const eventId = row.event_id as string;

  const { data: reachable } = await scoped
    .from("events")
    .select("id")
    .eq("id", eventId)
    .maybeSingle();
  if (!reachable) {
    return { success: false, error: "You don't have access to this event." };
  }

  const includeFields = (row.include_fields ?? []) as ExportField[];
  const format = row.format as ExportFormat;

  const { filename, data } = await buildExportData(eventId, includeFields, format);

  // Leading segment must be the event id: the storage policies scope reads by
  // the owning event (20260728000001_storage_tenant_scoping.sql).
  const storagePath = `${eventId}/exports/${filename}`;
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
