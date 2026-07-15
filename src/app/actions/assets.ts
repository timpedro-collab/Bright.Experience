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
import { autoCompleteTaskByPath } from "@/app/actions/tasks";
import { writeAudit } from "@/lib/audit";
import { bumpStreak } from "./streak";
import {
  storagePathFor,
  validateUpload,
  type StorageBucket,
} from "@/lib/storage/signed-url";
import { scanUpload } from "@/lib/storage/scan";
import {
  buildSpecWarnings,
  imageDimensionsFromBuffer,
} from "@/lib/asset-requirements/validate";
import { isInternalRole, canReviewCreativeAssets } from "@/lib/roles";
import { assetUploadSchema } from "@/lib/validations/assets";
import type { ActionResult } from "@/types/actions";
import type { UserRole } from "@/types";

const ASSET_BUCKET: StorageBucket = "event-assets";

/** Upload a file for an asset slot and trigger creative review. */
export async function uploadAsset(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  // Among internal staff only the Creative team may upload on the customer's
  // behalf — mirror the page's `canUpload` gate. Customers upload their own.
  const { data: actorProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  const actorRole = actorProfile?.role as UserRole | undefined;
  if (actorRole && isInternalRole(actorRole) && !canReviewCreativeAssets(actorRole)) {
    return {
      success: false,
      error: "Only the Creative team can upload on the customer's behalf.",
    };
  }

  const assetId = formData.get("assetId") as string;
  const eventId = formData.get("eventId") as string;
  const file = formData.get("file") as File;

  if (!file || !assetId || !eventId) {
    return { success: false, error: "Missing required fields" };
  }

  const parsed = assetUploadSchema.safeParse({
    assetId,
    eventId,
    fileName: file.name,
    fileType: file.type,
    fileSizeBytes: file.size,
  });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid upload" };
  }

  const check = validateUpload(ASSET_BUCKET, {
    type: file.type,
    size: file.size,
    name: file.name,
  });
  if (!check.ok) {
    return { success: false, error: check.detail };
  }

  // Malware screen before anything touches storage. No-ops gracefully when
  // FILE_SCAN_URL isn't configured (local/dev/pre-handoff).
  const scanBytes = new Uint8Array(await file.arrayBuffer());
  const scan = await scanUpload(scanBytes, file.name);
  if (!scan.ok) {
    return {
      success: false,
      error: scan.detail ?? "This file was flagged by our security scan.",
    };
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
    return { success: false, error: `Upload failed: ${uploadError.message}` };
  }

  const warnings: string[] = [];
  const { data: existingAsset } = await supabase
    .from("assets")
    .select("version, required_file_types, required_resolution_min, required_duration_range")
    .eq("id", assetId)
    .single();

  if (existingAsset?.required_file_types?.length) {
    const accepted = existingAsset.required_file_types as string[];
    if (!accepted.includes(file.type)) {
      warnings.push(
        `File type "${file.type}" doesn't match accepted types: ${accepted.join(", ")}`
      );
    }
  }

  // Dimension/duration spec validation. Prefer client-measured values
  // (forwarded as hidden fields); fall back to parsing image headers so we
  // don't depend solely on the client being honest.
  const clientWidth = Number(formData.get("width")) || undefined;
  const clientHeight = Number(formData.get("height")) || undefined;
  const clientDuration = Number(formData.get("durationSeconds")) || undefined;

  let measuredWidth = clientWidth;
  let measuredHeight = clientHeight;
  if (
    (!measuredWidth || !measuredHeight) &&
    (file.type === "image/png" || file.type === "image/jpeg")
  ) {
    try {
      const bytes = new Uint8Array(await file.arrayBuffer());
      const dims = imageDimensionsFromBuffer(bytes);
      if (dims) {
        measuredWidth = dims.width;
        measuredHeight = dims.height;
      }
    } catch {
      // header parse is best-effort; ignore failures
    }
  }

  warnings.push(
    ...buildSpecWarnings(
      {
        fileType: file.type,
        width: measuredWidth,
        height: measuredHeight,
        durationSeconds: clientDuration,
      },
      {
        required_resolution_min: existingAsset?.required_resolution_min,
        required_duration_range: existingAsset?.required_duration_range,
      },
    ),
  );

  const nextVersion = (existingAsset?.version ?? 0) + 1;

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
      version: nextVersion,
      upload_warnings: warnings.length > 0 ? warnings : null,
    })
    .eq("id", assetId);

  if (updateError) {
    return { success: false, error: `Update failed: ${updateError.message}` };
  }

  // Retain this upload as an immutable version row. Best-effort: never block
  // the upload if the versions table isn't present yet.
  await supabase
    .from("asset_versions")
    .insert({
      asset_id: assetId,
      event_id: eventId,
      version: nextVersion,
      file_path: path,
      file_name: file.name,
      file_size: file.size,
      file_type: file.type,
      uploaded_by: user.id,
      upload_warnings: warnings.length > 0 ? warnings : null,
      review_status: "pending_review",
    })
    .then(
      () => {},
      () => {},
    );

  await writeAudit({
    eventId,
    actorId: user.id,
    action: "asset_uploaded",
    entityType: "asset",
    entityId: assetId,
    metadata: { file_name: file.name, file_size: file.size, file_path: path },
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

  const { data: remaining } = await supabase
    .from("assets")
    .select("id")
    .eq("event_id", eventId)
    .eq("status", "required")
    .limit(1);

  if (!remaining || remaining.length === 0) {
    await autoCompleteTaskByPath(eventId, "assets");
  }

  bumpStreak().catch(() => {});

  revalidatePath(`/events/${eventId}/assets`);
  revalidatePath("/admin/asset-reviews");
  revalidatePath(`/events/${eventId}`);
  revalidatePath("/ops");
  return { success: true, data: undefined };
}
