"use server";

/**
 * Server actions for event messaging.
 *
 * Messages live on per-event threads. Internal-only messages are hidden
 * from customer views. Notifications are dispatched to relevant
 * stakeholders on each send.
 */

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { dispatchNotification } from "@/lib/notifications/dispatch";
import { sendMessageSchema } from "@/lib/validations/messages";
import { validateUpload, storagePathFor, createSignedReadUrl } from "@/lib/storage/signed-url";
import { scanUpload } from "@/lib/storage/scan";
import type { ActionResult } from "@/types/actions";

export type MessageTopic = "general" | "creative" | "logistics" | "compliance" | "configuration" | "finance";

/** Send a message on an event thread. Creates notifications for relevant users. */
export async function sendMessage(
  eventId: string,
  body: string,
  isInternal: boolean,
  attachments?: { name: string; url: string; size: number }[],
  topic?: MessageTopic
): Promise<ActionResult<{ id: string }>> {
  const parsed = sendMessageSchema.safeParse({ eventId, body, isInternal });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const { data: message, error } = await supabase
    .from("messages")
    .insert({
      event_id: eventId,
      sender_id: user.id,
      body: body.trim(),
      is_internal: isInternal,
      attachments: attachments && attachments.length > 0 ? attachments : null,
      topic: topic ?? "general",
    })
    .select()
    .single();

  if (error) return { success: false, error: `Failed to send message: ${error.message}` };

  await supabase.from("audit_entries").insert({
    event_id: eventId,
    actor_id: user.id,
    action: "message_sent",
    entity_type: "message",
    entity_id: message.id,
    metadata: { is_internal: isInternal },
  });

  const { data: senderProfile } = await supabase
    .from("profiles")
    .select("name")
    .eq("id", user.id)
    .single();
  const senderName = senderProfile?.name ?? "Someone";

  await dispatchNotification("message.received", {
    eventId,
    actorId: user.id,
    messageId: message.id,
    senderName,
    preview: body.length > 100 ? `${body.slice(0, 100)}…` : body,
    entityType: "message",
    entityId: message.id,
  });

  revalidatePath(`/events/${eventId}/communications`);
  return { success: true, data: { id: message.id } };
}

/** Upload a file attachment for a message. Returns a signed URL. */
export async function uploadMessageAttachment(
  formData: FormData
): Promise<ActionResult<{ url: string }>> {
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

  const check = validateUpload("event-assets", { type: file.type, size: file.size, name: file.name });
  if (!check.ok) return { success: false, error: check.detail };

  const path = storagePathFor({
    eventId,
    entityType: "message-attachment",
    entityId: user.id,
    filename: file.name,
  });

  const buffer = Buffer.from(await file.arrayBuffer());

  const scan = await scanUpload(buffer, file.name);
  if (!scan.ok) {
    return { success: false, error: scan.detail ?? "This file was flagged by our security scan." };
  }

  const { error: uploadError } = await supabase.storage
    .from("event-assets")
    .upload(path, buffer, { contentType: file.type, upsert: false });

  if (uploadError) {
    return { success: false, error: `Upload failed: ${uploadError.message}` };
  }

  const url = await createSignedReadUrl(supabase, "event-assets", path, 60 * 60 * 24 * 7);
  if (!url) return { success: false, error: "Could not generate download URL" };

  return { success: true, data: { url } };
}
