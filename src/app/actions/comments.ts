"use server";

/** Server actions for threaded comments on assets. */
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { writeAudit } from "@/lib/audit";
import { dispatchNotification } from "@/lib/notifications/dispatch";
import { isInternalRole } from "@/lib/roles";
import type { ActionResult } from "@/types/actions";
import type { UserRole } from "@/types";

/** Add a comment (optionally threaded via parentId). */
export async function addComment(
  eventId: string,
  assetId: string,
  body: string,
  parentId?: string,
): Promise<ActionResult<{ id: string }>> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const trimmed = body.trim();
  if (!trimmed) return { success: false, error: "Comment body is required" };

  const { data, error } = await supabase
    .from("comments")
    .insert({
      event_id: eventId,
      asset_id: assetId,
      author_id: user.id,
      body: trimmed,
      parent_id: parentId ?? null,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { success: false, error: "Could not add comment. Please try again." };
  }

  await writeAudit({
    eventId,
    actorId: user.id,
    action: "comment_added",
    entityType: "asset",
    entityId: assetId,
    metadata: { commentId: data.id, parentId },
  });

  const { data: profile } = await supabase
    .from("profiles")
    .select("name")
    .eq("id", user.id)
    .single();
  const { data: asset } = await supabase
    .from("assets")
    .select("name")
    .eq("id", assetId)
    .single();

  dispatchNotification("comment.new", {
    eventId,
    assetId,
    actorId: user.id,
    authorName: profile?.name ?? "Someone",
    assetName: asset?.name ?? "an asset",
    preview: trimmed.length > 100 ? `${trimmed.slice(0, 100)}…` : trimmed,
    entityType: "comment",
    entityId: data.id as string,
  }).catch(() => {});

  revalidatePath(`/events/${eventId}/assets`);
  revalidatePath("/admin/asset-reviews");
  return { success: true, data: { id: data.id as string } };
}

/** Delete a comment — only the author or an internal user may delete. */
export async function deleteComment(commentId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const { data: comment } = await supabase
    .from("comments")
    .select("author_id, event_id")
    .eq("id", commentId)
    .single();

  if (!comment) return { success: false, error: "Comment not found" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const role = (profile?.role as UserRole) ?? "customer_user";
  const isOwner = comment.author_id === user.id;
  if (!isOwner && !isInternalRole(role)) {
    return { success: false, error: "Not authorised to delete this comment" };
  }

  const { error } = await supabase.from("comments").delete().eq("id", commentId);
  if (error) return { success: false, error: "Could not delete comment. Please try again." };

  revalidatePath(`/events/${comment.event_id}/assets`);
  revalidatePath("/admin/asset-reviews");
  return { success: true, data: undefined };
}
