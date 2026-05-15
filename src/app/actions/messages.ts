"use server";

/** Server actions for event messaging */

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { dispatchNotification } from "@/lib/notifications/dispatch";

/** Send a message on an event thread. Creates notifications for relevant users. */
export async function sendMessage(
  eventId: string,
  body: string,
  isInternal: boolean
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  if (!body.trim()) throw new Error("Message body cannot be empty");

  const { data: message, error } = await supabase
    .from("messages")
    .insert({
      event_id: eventId,
      sender_id: user.id,
      body: body.trim(),
      is_internal: isInternal,
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to send message: ${error.message}`);

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
}
