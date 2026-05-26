"use server";

/**
 * Asset upload + review server actions.
 *
 * Uploads land in the private `event-assets` Supabase Storage bucket;
 * every read is signed on demand. The asset row stores the storage
 * `file_path` (not a URL) so renderers can re-sign whenever they need
 * a fresh URL.
 */

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { dispatchNotification } from "@/lib/notifications/dispatch";
import {
  storagePathFor,
  validateUpload,
  type StorageBucket,
} from "@/lib/storage/signed-url";

const ASSET_BUCKET: StorageBucket = "event-assets";

export async function uploadAsset(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const assetId = formData.get("assetId") as string;
  const eventId = formData.get("eventId") as string;
  const file = formData.get("file") as File;

  if (!file || !assetId || !eventId) {
    throw new Error("Missing required fields");
  }

  const check = validateUpload(ASSET_BUCKET, {
    type: file.type,
    size: file.size,
    name: file.name,
  });
  if (!check.ok) {
    throw new Error(check.detail);
  }

  const path = storagePathFor({
    eventId,
    entityType: "asset",
    entityId: assetId,
    filename: file.name,
  });

  const { error: uploadError } = await supabase.storage
    .from(ASSET_BUCKET)
    .upload(path, file, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    throw new Error(`Upload failed: ${uploadError.message}`);
  }

  // We store the *path* on the row, not the URL. Read surfaces sign
  // on demand via createSignedReadUrl. This keeps URLs short-lived
  // and prevents any accidental "leaked link" failure mode.
  const { error: updateError } = await supabase
    .from("assets")
    .update({
      file_url: path,
      file_name: file.name,
      file_size: file.size,
      file_type: file.type,
      status: "under_review",
      review_status: "pending_review",
      uploaded_by: user.id,
    })
    .eq("id", assetId);

  if (updateError) {
    throw new Error(`Update failed: ${updateError.message}`);
  }

  await supabase.from("audit_entries").insert({
    event_id: eventId,
    actor_id: user.id,
    action: "asset_uploaded",
    entity_type: "asset",
    entity_id: assetId,
    metadata: {
      file_name: file.name,
      file_size: file.size,
      file_path: path,
    },
  });

  const [{ data: assetRow }, { data: uploaderProfile }, { data: eventRow }] =
    await Promise.all([
      supabase.from("assets").select("name").eq("id", assetId).single(),
      supabase.from("profiles").select("name").eq("id", user.id).single(),
      supabase.from("events").select("name").eq("id", eventId).single(),
    ]);

  await dispatchNotification("asset.review_needed", {
    eventId,
    assetId,
    actorId: user.id,
    assetName: assetRow?.name ?? file.name,
    contactName: uploaderProfile?.name ?? "A customer",
    eventName: eventRow?.name ?? "an upcoming event",
    entityType: "asset",
    entityId: assetId,
  });

  revalidatePath(`/events/${eventId}/assets`);
}

export async function reviewAsset(
  assetId: string,
  eventId: string,
  action: "accepted" | "rejected",
  feedback?: string
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("assets")
    .update({
      status: action,
      review_feedback: feedback || null,
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", assetId);

  if (error) throw new Error(`Review failed: ${error.message}`);

  await supabase.from("audit_entries").insert({
    event_id: eventId,
    actor_id: user.id,
    action: `asset_${action}`,
    entity_type: "asset",
    entity_id: assetId,
    metadata: { feedback },
  });

  revalidatePath(`/events/${eventId}/assets`);
}
