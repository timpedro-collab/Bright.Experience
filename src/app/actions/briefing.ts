"use server";

/**
 * Server actions for customer briefing form submissions.
 *
 * Briefings are upserted by (event_id, form_type) so customers can
 * save-and-resume without creating duplicate rows. The final submission
 * dispatches notifications to the internal team.
 */

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { dispatchNotification } from "@/lib/notifications/dispatch";
import { autoCompleteTaskByPath } from "@/app/actions/tasks";
import { validateUpload, storagePathFor, createSignedReadUrl } from "@/lib/storage/signed-url";
import { scanUpload } from "@/lib/storage/scan";
import { bumpStreak } from "./streak";
import type { ActionResult } from "@/types/actions";

/** Save (or submit) a briefing response for an event. */
export async function saveBriefingResponse(
  eventId: string,
  formType: string,
  responses: Record<string, unknown>,
  submit: boolean = false
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const updateData: Record<string, unknown> = {
    responses,
  };

  if (submit) {
    updateData.is_submitted = true;
    updateData.submitted_by = user.id;
    updateData.submitted_at = new Date().toISOString();
  }

  const { error } = await supabase
    .from("briefing_responses")
    .upsert(
      {
        event_id: eventId,
        form_type: formType,
        ...updateData,
      },
      { onConflict: "event_id,form_type" }
    );

  if (error) return { success: false, error: `Save failed: ${error.message}` };

  if (submit) {
    await supabase.from("audit_entries").insert({
      event_id: eventId,
      actor_id: user.id,
      action: "briefing_submitted",
      entity_type: "briefing_response",
      entity_id: eventId,
      metadata: { form_type: formType },
    });

    const [{ data: eventRow }, { data: profile }] = await Promise.all([
      supabase.from("events").select("name").eq("id", eventId).single(),
      supabase.from("profiles").select("name").eq("id", user.id).single(),
    ]);

    await dispatchNotification("briefing.submitted", {
      eventId,
      actorId: user.id,
      briefingFormType: formType,
      eventName: eventRow?.name ?? "your event",
      contactName: profile?.name ?? "The customer",
      entityType: "briefing_response",
      entityId: eventId,
    });
  }

  if (submit) {
    await autoCompleteTaskByPath(eventId, "briefing");
    bumpStreak().catch(() => {});
  }

  revalidatePath(`/events/${eventId}/briefing`);
  revalidatePath(`/events/${eventId}/actions`);
  return { success: true, data: undefined };
}

/** Upload a brand kit or reference file to the briefings storage bucket. */
export async function uploadBriefingFile(
  formData: FormData
): Promise<ActionResult<{ fileName: string; storagePath: string }>> {
  const eventId = formData.get("eventId") as string;
  const file = formData.get("file") as File;
  if (!eventId || !file) {
    return { success: false, error: "Missing event ID or file" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const check = validateUpload("briefings", { type: file.type, size: file.size, name: file.name });
  if (!check.ok) return { success: false, error: check.detail };

  const path = storagePathFor({
    eventId,
    entityType: "briefing",
    entityId: eventId,
    filename: file.name,
  });

  const buffer = Buffer.from(await file.arrayBuffer());

  const scan = await scanUpload(buffer, file.name);
  if (!scan.ok) {
    return { success: false, error: scan.detail ?? "This file was flagged by our security scan." };
  }

  const { error: uploadError } = await supabase.storage
    .from("briefings")
    .upload(path, buffer, { contentType: file.type, upsert: false });

  if (uploadError) {
    return { success: false, error: `Upload failed: ${uploadError.message}` };
  }

  revalidatePath(`/events/${eventId}/briefing`);
  return { success: true, data: { fileName: file.name, storagePath: path } };
}

/** List briefing files uploaded for an event. */
export async function getBriefingFiles(
  eventId: string
): Promise<{ name: string; path: string; url: string | null }[]> {
  const supabase = await createClient();
  const prefix = `${eventId}/briefing/`;
  const { data, error } = await supabase.storage
    .from("briefings")
    .list(prefix.replace(/\/$/, ""), { limit: 50 });

  if (error || !data) return [];

  const files: { name: string; path: string; url: string | null }[] = [];
  for (const item of data) {
    if (!item.name) continue;
    const fullPath = `${prefix}${item.name}`;
    const url = await createSignedReadUrl(supabase, "briefings", fullPath);
    files.push({ name: item.name, path: fullPath, url });
  }
  return files;
}
