/** Supabase queries for event messaging */

import { createClient } from "@/lib/supabase/server";

/** Fetch messages for an event with sender profile, ordered chronologically. RLS filters internal messages for customers. */
export async function getMessagesByEvent(eventId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("messages")
    .select("*, sender:profiles!messages_sender_id_fkey(id, name, email, role)")
    .eq("event_id", eventId)
    .order("created_at", { ascending: true });

  if (error || !data) return [];
  return data.map((row) => {
    const sender = row.sender as Record<string, unknown> | null;
    return {
      id: row.id as string,
      eventId: row.event_id as string,
      senderId: row.sender_id as string,
      senderName: (sender?.name as string) ?? "Unknown",
      body: row.body as string,
      attachments: (row.attachments as string[]) ?? [],
      isInternal: row.is_internal as boolean,
      topic: (row.topic as string | null) ?? "general",
      createdAt: row.created_at as string,
    };
  });
}

/** Count of messages for an event */
export async function getMessageCount(eventId: string): Promise<number> {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("messages")
    .select("*", { count: "exact", head: true })
    .eq("event_id", eventId);

  if (error) return 0;
  return count ?? 0;
}
