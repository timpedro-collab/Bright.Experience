/** Asset types — customer creative, its revision history, and annotations. */

export type AssetStatus =
  | "required"
  | "uploaded"
  | "under_review"
  | "accepted"
  | "rejected";

/**
 * Bright.Blue creative review state — orthogonal to the customer-facing
 * `status` enum. `pending_review` is the default after upload, `approved`
 * clears any milestone gates, and `revision_requested` always carries a
 * feedback string the customer reads inline.
 */
export type AssetReviewStatus =
  | "pending_review"
  | "approved"
  | "revision_requested";

export interface Asset {
  id: string;
  eventId: string;
  name: string;
  description?: string;
  assetType: string;
  requiredFormat?: string;
  requiredDimensions?: string;
  /**
   * Internal Supabase Storage path the upload lives at (e.g.
   * `eventId/asset/assetId/<ts>-file.png`). Renderers receive a
   * short-lived signed URL under `fileUrl` instead.
   */
  filePath?: string;
  /** Short-lived signed URL resolved by `attachSignedUrls`. */
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  version: number;
  status: AssetStatus;
  reviewFeedback?: string;
  dueDate?: string;
  customerVisible: boolean;
  /** Creative-team review state (PR 2: asset review gate). */
  reviewStatus: AssetReviewStatus;
  reviewDecidedBy?: string;
  reviewDecidedAt?: string;
  revisionCount: number;
  uploadedBy?: string;
  /** Last upload/metadata change — drives the reviewer queue aging label. */
  updatedAt?: string;
  /** Extended spec metadata (WS2: Asset Spec Intelligence). */
  requiredResolutionMin?: string;
  requiredDurationRange?: string;
  requiredFileTypes?: string[];
  animationRequirements?: string;
  safeZoneDescription?: string;
  referenceUrl?: string;
  isPhysical?: boolean;
  specDocumentUrl?: string;
  uploadWarnings?: string[];
}

/** One retained upload of an asset — the revision-round history. */
export interface AssetVersion {
  id: string;
  assetId: string;
  eventId: string;
  version: number;
  filePath?: string;
  /** Short-lived signed URL resolved on read. */
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  fileType?: string;
  uploadedBy?: string;
  uploaderName?: string;
  uploadWarnings?: string[];
  reviewStatus: AssetReviewStatus;
  reviewFeedback?: string;
  reviewDecidedBy?: string;
  reviewDecidedAt?: string;
  createdAt: string;
}

/** A region-anchored note on a specific asset version. */
export interface AssetAnnotation {
  id: string;
  assetId: string;
  assetVersionId?: string;
  eventId: string;
  authorId: string;
  authorName?: string;
  /** Anchor rect as a percentage of the rendered preview (0-100). */
  x: number;
  y: number;
  w: number;
  h: number;
  body: string;
  resolved: boolean;
  createdAt: string;
}

/** A threaded comment, optionally anchored to an asset. */
export interface Comment {
  id: string;
  eventId: string;
  assetId?: string;
  authorId: string;
  authorName?: string;
  body: string;
  parentId?: string;
  createdAt: string;
}
