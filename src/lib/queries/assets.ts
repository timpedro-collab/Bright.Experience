import { createClient } from "@/lib/supabase/server";
import { createSignedReadUrl } from "@/lib/storage/signed-url";
import { PAGE_SIZE, paginateQuery, totalPages } from "@/lib/pagination";
import type {
  Asset,
  AssetAnnotation,
  AssetDecisionLogEntry,
  AssetReviewStatus,
  AssetVersion,
} from "@/types";
import { logQueryError } from "@/lib/observability/log-query-error";

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
    // The DB column stores a storage path; renderers receive a signed
    // URL (resolved below) under `fileUrl`.
    filePath: (row.file_url as string | null) ?? undefined,
    fileUrl: undefined,
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
    updatedAt: (row.updated_at as string | null) ?? undefined,
    revisionCount: (row.revision_count as number | null) ?? 0,
    uploadedBy: (row.uploaded_by as string | null) ?? undefined,
    requiredResolutionMin: (row.required_resolution_min as string | null) ?? undefined,
    requiredDurationRange: (row.required_duration_range as string | null) ?? undefined,
    requiredFileTypes: (row.required_file_types as string[] | null) ?? undefined,
    animationRequirements: (row.animation_requirements as string | null) ?? undefined,
    safeZoneDescription: (row.safe_zone_description as string | null) ?? undefined,
    referenceUrl: (row.reference_url as string | null) ?? undefined,
    isPhysical: Boolean(row.is_physical),
    specDocumentUrl: (row.spec_document_url as string | null) ?? undefined,
    uploadWarnings: (row.upload_warnings as string[] | null) ?? undefined,
  };
}

/**
 * Looks the storage path on each asset and resolves a short-lived
 * signed URL. Failures swallowed so a single missing object never
 * breaks the page; the row simply renders without an "open" link.
 *
 * For legacy rows whose `file_url` is an absolute URL (the pre-
 * migration shape), we treat that as already-signed and pass it
 * through unchanged.
 */
async function attachSignedUrls<T extends Asset>(
  supabase: Awaited<ReturnType<typeof createClient>>,
  assets: T[]
): Promise<T[]> {
  return Promise.all(
    assets.map(async (asset) => {
      if (!asset.filePath) return asset;
      // Legacy or test-fixture rows that wrote an absolute URL.
      if (/^https?:|^\//.test(asset.filePath)) {
        return { ...asset, fileUrl: asset.filePath };
      }
      const signed = await createSignedReadUrl(
        supabase,
        "event-assets",
        asset.filePath
      );
      return { ...asset, fileUrl: signed ?? undefined };
    })
  );
}

export async function getAssetsByEvent(eventId: string): Promise<Asset[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("assets")
    .select("*")
    .eq("event_id", eventId)
    .order("created_at");

  if (error || !data) {
    logQueryError("getAssetsByEvent", error, { eventId });
    return [];
  }
  const assets = data.map((row) => mapAsset(row as Record<string, unknown>));
  return attachSignedUrls(supabase, assets);
}

/**
 * Every asset waiting on a Bright.Blue creative review, oldest-stale first,
 * paginated for the `/admin/asset-reviews` queue. The queue is unbounded (one
 * row per customer upload awaiting sign-off), so we page it server-side and
 * only sign URLs for the current slice.
 */
export async function getAssetsPendingReviewPaginated(
  page: number = 1,
  pageSize: number = PAGE_SIZE,
): Promise<{
  data: (Asset & { eventName: string | null; uploaderName: string | null })[];
  totalCount: number;
  totalPages: number;
}> {
  const supabase = await createClient();
  const query = supabase
    .from("assets")
    .select(
      "*, events(name), uploader:profiles!assets_uploaded_by_fkey(name)",
      { count: "exact" },
    )
    .eq("review_status", "pending_review")
    .not("file_url", "is", null)
    .order("updated_at", { ascending: true });

  const { data, error, count } = await paginateQuery(query, page, pageSize);
  if (error || !data) {
    logQueryError("getAssetsPendingReviewPaginated", error);
    return { data: [], totalCount: 0, totalPages: 1 };
  }

  const enriched = data.map((row) => {
    const r = row as Record<string, unknown>;
    const events = r.events as { name?: string } | null;
    const uploader = r.uploader as { name?: string } | null;
    return {
      ...mapAsset(r),
      eventName: events?.name ?? null,
      uploaderName: uploader?.name ?? null,
    };
  });
  const withUrls = await attachSignedUrls(supabase, enriched);
  const total = count ?? 0;
  return {
    data: withUrls,
    totalCount: total,
    totalPages: totalPages(total, pageSize),
  };
}

/**
 * Full version history for one asset, newest first, each with a signed URL.
 * Returns [] gracefully if the versions table isn't provisioned yet.
 */
export async function getAssetVersions(
  assetId: string,
): Promise<AssetVersion[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("asset_versions")
    .select("*, uploader:profiles!asset_versions_uploaded_by_fkey(name)")
    .eq("asset_id", assetId)
    .order("version", { ascending: false });

  if (error || !data) {
    logQueryError("getAssetVersions", error, { assetId });
    return [];
  }

  const versions: AssetVersion[] = data.map((row) => {
    const r = row as Record<string, unknown>;
    const uploader = r.uploader as { name?: string } | null;
    return {
      id: String(r.id),
      assetId: String(r.asset_id),
      eventId: String(r.event_id),
      version: Number(r.version ?? 1),
      filePath: (r.file_path as string | null) ?? undefined,
      fileUrl: undefined,
      fileName: (r.file_name as string | null) ?? undefined,
      fileSize: (r.file_size as number | null) ?? undefined,
      fileType: (r.file_type as string | null) ?? undefined,
      uploadedBy: (r.uploaded_by as string | null) ?? undefined,
      uploaderName: uploader?.name ?? undefined,
      uploadWarnings: (r.upload_warnings as string[] | null) ?? undefined,
      reviewStatus:
        (r.review_status as AssetReviewStatus | null) ?? "pending_review",
      reviewFeedback: (r.review_feedback as string | null) ?? undefined,
      reviewDecidedBy: (r.review_decided_by as string | null) ?? undefined,
      reviewDecidedAt: (r.review_decided_at as string | null) ?? undefined,
      createdAt: String(r.created_at ?? ""),
    };
  });

  return Promise.all(
    versions.map(async (v) => {
      if (!v.filePath) return v;
      if (/^https?:|^\//.test(v.filePath)) {
        return { ...v, fileUrl: v.filePath };
      }
      const signed = await createSignedReadUrl(
        supabase,
        "event-assets",
        v.filePath,
      );
      return { ...v, fileUrl: signed ?? undefined };
    }),
  );
}

/**
 * Region-anchored annotations for an asset, oldest first.
 * Returns [] gracefully if the annotations table isn't provisioned yet.
 */
export async function getAssetAnnotations(
  assetId: string,
): Promise<AssetAnnotation[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("asset_annotations")
    .select("*, author:profiles!asset_annotations_author_id_fkey(name)")
    .eq("asset_id", assetId)
    .order("created_at", { ascending: true });

  if (error || !data) {
    logQueryError("getAssetAnnotations", error, { assetId });
    return [];
  }

  return data.map((row) => {
    const r = row as Record<string, unknown>;
    const author = r.author as { name?: string } | null;
    return {
      id: String(r.id),
      assetId: String(r.asset_id),
      assetVersionId: (r.asset_version_id as string | null) ?? undefined,
      eventId: String(r.event_id),
      authorId: String(r.author_id),
      authorName: author?.name ?? undefined,
      x: Number(r.x ?? 0),
      y: Number(r.y ?? 0),
      w: Number(r.w ?? 0),
      h: Number(r.h ?? 0),
      body: String(r.body ?? ""),
      resolved: Boolean(r.resolved),
      createdAt: String(r.created_at ?? ""),
    };
  });
}

/**
 * Batch-load annotations for many assets at once, keyed by asset id.
 *
 * Used by the customer/event asset list so the spatial pins a reviewer drops
 * surface alongside the textual feedback — without an N+1 query per row.
 */
export async function getAnnotationsByAssets(
  assetIds: string[],
): Promise<Record<string, AssetAnnotation[]>> {
  if (assetIds.length === 0) return {};
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("asset_annotations")
    .select("*, author:profiles!asset_annotations_author_id_fkey(name)")
    .in("asset_id", assetIds)
    .order("created_at", { ascending: true });

  if (error || !data) {
    logQueryError("getAnnotationsByAssets", error);
    return {};
  }

  const byAsset: Record<string, AssetAnnotation[]> = {};
  for (const row of data) {
    const r = row as Record<string, unknown>;
    const author = r.author as { name?: string } | null;
    const assetId = String(r.asset_id);
    const annotation: AssetAnnotation = {
      id: String(r.id),
      assetId,
      assetVersionId: (r.asset_version_id as string | null) ?? undefined,
      eventId: String(r.event_id),
      authorId: String(r.author_id),
      authorName: author?.name ?? undefined,
      x: Number(r.x ?? 0),
      y: Number(r.y ?? 0),
      w: Number(r.w ?? 0),
      h: Number(r.h ?? 0),
      body: String(r.body ?? ""),
      resolved: Boolean(r.resolved),
      createdAt: String(r.created_at ?? ""),
    };
    (byAsset[assetId] ??= []).push(annotation);
  }
  return byAsset;
}

/**
 * Full creative approval audit trail for an event — every retained version
 * row across all assets, newest activity first. Used by the CSV export route.
 */
export async function getAssetDecisionLog(
  eventId: string,
): Promise<AssetDecisionLogEntry[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("asset_versions")
    .select(
      `
      id,
      asset_id,
      version,
      file_name,
      review_status,
      review_feedback,
      review_decided_by,
      review_decided_at,
      created_at,
      uploaded_by,
      asset:assets!asset_versions_asset_id_fkey(name),
      uploader:profiles!asset_versions_uploaded_by_fkey(name),
      reviewer:profiles!asset_versions_review_decided_by_fkey(name)
    `,
    )
    .eq("event_id", eventId)
    .order("created_at", { ascending: false });

  if (error || !data) {
    logQueryError("getAssetDecisionLog", error, { eventId });
    return [];
  }

  return data.map((row) => {
    const r = row as Record<string, unknown>;
    const asset = r.asset as { name?: string } | null;
    const uploader = r.uploader as { name?: string } | null;
    const reviewer = r.reviewer as { name?: string } | null;
    return {
      assetId: String(r.asset_id),
      assetName: asset?.name ?? "Unknown asset",
      version: Number(r.version ?? 1),
      versionId: String(r.id),
      uploadedAt: String(r.created_at ?? ""),
      uploadedBy: (r.uploaded_by as string | null) ?? undefined,
      uploaderName: uploader?.name ?? undefined,
      fileName: (r.file_name as string | null) ?? undefined,
      reviewStatus:
        (r.review_status as AssetReviewStatus | null) ?? "pending_review",
      reviewFeedback: (r.review_feedback as string | null) ?? undefined,
      reviewDecidedBy: (r.review_decided_by as string | null) ?? undefined,
      reviewerName: reviewer?.name ?? undefined,
      reviewDecidedAt: (r.review_decided_at as string | null) ?? undefined,
    };
  });
}
