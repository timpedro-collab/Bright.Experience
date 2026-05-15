"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { dispatchNotification } from "@/lib/notifications/dispatch";

export async function uploadAsset(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const assetId = formData.get("assetId") as string;
  const eventId = formData.get("eventId") as string;
  const file = formData.get("file") as File;

  if (!file || !assetId || !eventId) throw new Error("Missing required fields");

  const ext = file.name.split(".").pop();
  const path = `${eventId}/${assetId}/${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("event-assets")
    .upload(path, file);

  if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);

  const {
    data: { publicUrl },
  } = supabase.storage.from("event-assets").getPublicUrl(path);

  const { error: updateError } = await supabase
    .from("assets")
    .update({
      file_url: publicUrl,
      file_name: file.name,
      file_size: file.size,
      file_type: file.type,
      status: "under_review",
      review_status: "pending_review",
      uploaded_by: user.id,
    })
    .eq("id", assetId);

  if (updateError) throw new Error(`Update failed: ${updateError.message}`);

  await supabase.from("audit_entries").insert({
    event_id: eventId,
    actor_id: user.id,
    action: "asset_uploaded",
    entity_type: "asset",
    entity_id: assetId,
    metadata: { file_name: file.name, file_size: file.size },
  });

  // Fetch context for the notification — the creative lead needs to see
  // the asset name + uploader to route the review.
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
