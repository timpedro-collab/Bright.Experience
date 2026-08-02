/** Comment queries — fetch threaded comments for assets. */
import { createClient } from "@/lib/supabase/server";
import type { Comment } from "@/types";
import { logQueryError } from "@/lib/observability/log-query-error";

function mapComment(row: Record<string, unknown>): Comment {
  const author = row.profiles as Record<string, unknown> | null;
  const version = row.asset_version as { version?: number } | null;
  return {
    id: row.id as string,
    eventId: row.event_id as string,
    assetId: (row.asset_id as string) ?? undefined,
    assetVersionId: (row.asset_version_id as string | null) ?? undefined,
    assetVersionNumber: version?.version ?? undefined,
    authorId: row.author_id as string,
    authorName: (author?.name as string) ?? undefined,
    body: row.body as string,
    parentId: (row.parent_id as string) ?? undefined,
    createdAt: row.created_at as string,
  };
}
/** Fetch all comments for all assets belonging to an event, grouped by asset ID. */
export async function getCommentsByEvent(
  eventId: string,
): Promise<Record<string, Comment[]>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("comments")
    .select("*, profiles!comments_author_id_fkey(name), asset_version:asset_versions(version)")
    .eq("event_id", eventId)
    .not("asset_id", "is", null)
    .order("created_at");

  if (error || !data) {
    logQueryError("getCommentsByEvent", error, { eventId });
    return {};
  }
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

  if (error || !data) {
    logQueryError("getCommentCountsByAssets", error);
    return {};
  }
  const counts: Record<string, number> = {};
  for (const row of data) {
    const aid = row.asset_id as string;
    counts[aid] = (counts[aid] ?? 0) + 1;
  }
  return counts;
}
