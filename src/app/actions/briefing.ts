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
import { autoCompleteTaskByPath, autoCompleteTaskByPathAndTitle } from "@/app/actions/tasks";
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

/**
 * Brand Kit — structured brand identity (colours, fonts, usage rules).
 *
 * Stored alongside the creative briefing in the same `briefing_responses`
 * "creative" blob so the colour values are shared with the briefing's colour
 * question (edit in either place, see it in both) with no schema change.
 */
export interface BrandKit {
  colors: string;
  fontHeading: string;
  fontBody: string;
  usageDo: string;
  usageDont: string;
}

/** Read the brand kit fields from the creative briefing blob. */
export async function getBrandKit(eventId: string): Promise<BrandKit> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("briefing_responses")
    .select("responses")
    .eq("event_id", eventId)
    .eq("form_type", "creative")
    .maybeSingle();

  const r = (data?.responses ?? {}) as Record<string, string>;
  return {
    colors: r.color_preferences ?? "",
    fontHeading: r.brand_font_heading ?? "",
    fontBody: r.brand_font_body ?? "",
    usageDo: r.brand_usage_do ?? "",
    usageDont: r.brand_usage_dont ?? "",
  };
}

/** Save the brand kit, merging into the existing creative briefing blob. */
export async function saveBrandKit(eventId: string, kit: BrandKit): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  // Merge so we never clobber other creative-briefing answers.
  const { data: existing } = await supabase
    .from("briefing_responses")
    .select("responses")
    .eq("event_id", eventId)
    .eq("form_type", "creative")
    .maybeSingle();

  const merged: Record<string, unknown> = {
    ...((existing?.responses as Record<string, unknown>) ?? {}),
    color_preferences: kit.colors,
    brand_font_heading: kit.fontHeading,
    brand_font_body: kit.fontBody,
    brand_usage_do: kit.usageDo,
    brand_usage_dont: kit.usageDont,
  };

  const { error } = await supabase
    .from("briefing_responses")
    .upsert(
      { event_id: eventId, form_type: "creative", responses: merged },
      { onConflict: "event_id,form_type" }
    );

  if (error) return { success: false, error: `Save failed: ${error.message}` };

  // Count the brand kit as "done" once they've given us something usable.
  const hasContent =
    [kit.colors, kit.fontHeading, kit.fontBody, kit.usageDo, kit.usageDont].some(
      (v) => v.trim().length > 0
    );
  if (hasContent) {
    // Matches both the legacy ("…guidelines…") and renamed ("…brand kit…")
    // task titles so it works against existing and freshly seeded data.
    await autoCompleteTaskByPathAndTitle(eventId, "assets", ["guidelines", "brand kit"]);
  }

  revalidatePath(`/events/${eventId}/assets`);
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
