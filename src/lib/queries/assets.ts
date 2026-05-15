import { createClient } from "@/lib/supabase/server";
import type { Asset, AssetReviewStatus } from "@/types";

function mapAsset(row: Record<string, unknown>): Asset {
  return {
    id: String(row.id),
    eventId: String(row.event_id),
    name: String(row.name),
    description: (row.description as string | null) ?? undefined,
    assetType: String(row.asset_type),
    requiredFormat: (row.required_format as string | null) ?? undefined,
    requiredDimensions:
      (row.required_dimensions as string | null) ?? undefined,
    fileUrl: (row.file_url as string | null) ?? undefined,
    fileName: (row.file_name as string | null) ?? undefined,
    fileSize: (row.file_size as number | null) ?? undefined,
    version: (row.version as number | null) ?? 1,
    status: row.status as Asset["status"],
    reviewFeedback: (row.review_feedback as string | null) ?? undefined,
    dueDate: (row.due_date as string | null) ?? undefined,
    customerVisible: Boolean(row.customer_visible),
    reviewStatus:
      (row.review_status as AssetReviewStatus | null) ?? "pending_review",
    reviewDecidedBy:
      (row.review_decided_by as string | null) ?? undefined,
    reviewDecidedAt:
      (row.review_decided_at as string | null) ?? undefined,
    revisionCount: (row.revision_count as number | null) ?? 0,
    uploadedBy: (row.uploaded_by as string | null) ?? undefined,
  };
}

export async function getAssetsByEvent(eventId: string): Promise<Asset[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("assets")
    .select("*")
    .eq("event_id", eventId)
    .order("created_at");

  if (error || !data) return [];
  return data.map((row) => mapAsset(row as Record<string, unknown>));
}

/**
 * Every asset waiting on a Bright.Blue creative review, newest-stale first.
 * Powers the `/admin/asset-reviews` queue.
 */
export async function getAssetsPendingReview(): Promise<
  (Asset & { eventName: string | null; uploaderName: string | null })[]
> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("assets")
    .select("*, events(name), uploader:profiles!assets_uploaded_by_fkey(name)")
    .eq("review_status", "pending_review")
    .not("file_url", "is", null)
    .order("updated_at", { ascending: true });

  if (error || !data) return [];
  return data.map((row) => {
    const r = row as Record<string, unknown>;
    const events = r.events as { name?: string } | null;
    const uploader = r.uploader as { name?: string } | null;
    return {
      ...mapAsset(r),
      eventName: events?.name ?? null,
      uploaderName: uploader?.name ?? null,
    };
  });
}

export async function getAssetById(assetId: string): Promise<Asset | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("assets")
    .select("*")
    .eq("id", assetId)
    .single();
  if (error || !data) return null;
  return mapAsset(data as Record<string, unknown>);
}
