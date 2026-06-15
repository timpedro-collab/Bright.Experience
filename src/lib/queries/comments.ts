/** Comment queries — fetch threaded comments for assets. */
import { createClient } from "@/lib/supabase/server";
import type { Comment } from "@/types";

function mapComment(row: Record<string, unknown>): Comment {
  const author = row.profiles as Record<string, unknown> | null;
  return {
    id: row.id as string,
    eventId: row.event_id as string,
    assetId: (row.asset_id as string) ?? undefined,
    authorId: row.author_id as string,
    authorName: (author?.name as string) ?? undefined,
    body: row.body as string,
    parentId: (row.parent_id as string) ?? undefined,
    createdAt: row.created_at as string,
  };
}

/** Fetch all comments for a given asset, ordered oldest-first. */
export async function getCommentsByAsset(assetId: string): Promise<Comment[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("comments")
    .select("*, profiles!comments_author_id_fkey(name)")
    .eq("asset_id", assetId)
    .order("created_at");

  if (error || !data) return [];
  return data.map(mapComment);
}

/** Fetch all comments for all assets belonging to an event, grouped by asset ID. */
export async function getCommentsByEvent(
  eventId: string,
): Promise<Record<string, Comment[]>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("comments")
    .select("*, profiles!comments_author_id_fkey(name)")
    .eq("event_id", eventId)
    .not("asset_id", "is", null)
    .order("created_at");

  if (error || !data) return {};
  const grouped: Record<string, Comment[]> = {};
  for (const row of data) {
    const comment = mapComment(row);
    const aid = comment.assetId!;
    if (!grouped[aid]) grouped[aid] = [];
    grouped[aid].push(comment);
  }
  return grouped;
}

/** Fetch comment counts per asset for a batch of asset IDs. */
export async function getCommentCountsByAssets(
  assetIds: string[],
): Promise<Record<string, number>> {
  if (assetIds.length === 0) return {};
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("comments")
    .select("asset_id")
    .in("asset_id", assetIds);

  if (error || !data) return {};
  const counts: Record<string, number> = {};
  for (const row of data) {
    const aid = row.asset_id as string;
    counts[aid] = (counts[aid] ?? 0) + 1;
  }
  return counts;
}
