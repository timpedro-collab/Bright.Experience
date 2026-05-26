/**
 * Signed-URL helpers for the four Bright.Experience storage buckets.
 *
 * Every asset (briefing kit, creative upload, post-event report,
 * Bright.Studio deliverable) lives in a *private* Supabase Storage
 * bucket. Reads go through `createSignedUrl(...)`, writes go through
 * `createSignedUploadUrl(...)`, and the helpers validate MIME +
 * size before signing so the bucket itself stays free of garbage.
 *
 * Buckets:
 *   - `event-assets`        : customer-uploaded creative
 *   - `briefings`           : brand kits, briefing attachments
 *   - `reports`             : exported PDF reports
 *   - `studio-deliverables` : Bright.Studio final deliveries
 *
 * The bucket policies (see `20260403000010_schema_reconcile.sql`)
 * gate access by `is_internal_user()` for writes and authenticated
 * for reads. The signed URL itself carries a short-lived signature
 * that lets the browser fetch the object without an extra auth
 * roundtrip.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

export type StorageBucket =
  | "event-assets"
  | "briefings"
  | "reports"
  | "studio-deliverables";

/** Constraint set for a bucket — used by `validateUpload`. */
export interface BucketConstraints {
  /** Accepted MIME types, or `*` to skip the MIME check. */
  acceptedMimes: string[] | "*";
  /** Max file size in bytes. */
  maxBytes: number;
}

/**
 * Bucket-by-bucket upload constraints. Tight on size for the
 * report/studio buckets because the browser surfaces a friendly
 * error well below the Supabase 50 MB ceiling; broad on briefings
 * because clients send everything from brand decks to MP4s.
 */
const TEN_MB = 10 * 1024 * 1024;
const FIFTY_MB = 50 * 1024 * 1024;
const TWO_HUNDRED_MB = 200 * 1024 * 1024;

export const BUCKET_CONSTRAINTS: Record<StorageBucket, BucketConstraints> = {
  "event-assets": {
    acceptedMimes: [
      "image/png",
      "image/jpeg",
      "image/webp",
      "image/svg+xml",
      "application/pdf",
      "video/mp4",
      "video/quicktime",
    ],
    maxBytes: FIFTY_MB,
  },
  briefings: {
    acceptedMimes: "*", // brand kits, decks, fonts, anything
    maxBytes: TWO_HUNDRED_MB,
  },
  reports: {
    acceptedMimes: ["application/pdf"],
    maxBytes: TEN_MB,
  },
  "studio-deliverables": {
    acceptedMimes: [
      "image/png",
      "image/jpeg",
      "image/webp",
      "application/pdf",
      "video/mp4",
      "video/quicktime",
      "image/svg+xml",
    ],
    maxBytes: TWO_HUNDRED_MB,
  },
};

/** Default TTL for read URLs (one hour). */
const DEFAULT_READ_TTL_SECONDS = 60 * 60;

/**
 * Validate an upload candidate against the bucket's constraints.
 * Returns a discriminated result so callers don't have to juggle
 * separate error fields.
 */
export function validateUpload(
  bucket: StorageBucket,
  file: { type?: string; size: number; name?: string }
):
  | { ok: true }
  | { ok: false; reason: "size" | "mime"; detail: string } {
  const constraints = BUCKET_CONSTRAINTS[bucket];

  if (file.size > constraints.maxBytes) {
    return {
      ok: false,
      reason: "size",
      detail: `File is ${(file.size / 1024 / 1024).toFixed(1)} MB. Max for this bucket is ${(constraints.maxBytes / 1024 / 1024).toFixed(0)} MB.`,
    };
  }

  if (constraints.acceptedMimes !== "*") {
    if (!file.type || !constraints.acceptedMimes.includes(file.type)) {
      return {
        ok: false,
        reason: "mime",
        detail: file.type
          ? `${file.type} isn't a supported type for ${bucket}.`
          : `Upload didn't include a content type — re-pick the file and try again.`,
      };
    }
  }

  return { ok: true };
}

/**
 * Stable storage path for a given event + entity. Avoids collisions
 * by suffixing with the current timestamp; callers store the path
 * (not the URL) in their owning row so re-signing later is trivial.
 */
export function storagePathFor(input: {
  eventId: string;
  entityType: string;
  entityId: string;
  filename: string;
}): string {
  const sanitised = input.filename
    .normalize("NFKD")
    .replace(/[^A-Za-z0-9._-]/g, "_")
    .slice(0, 200);
  return `${input.eventId}/${input.entityType}/${input.entityId}/${Date.now()}-${sanitised}`;
}

/**
 * Create a signed URL for *reading* an object. Returns null if the
 * Supabase call errors so the calling page can render an empty
 * state instead of crashing.
 */
export async function createSignedReadUrl(
  supabase: SupabaseClient,
  bucket: StorageBucket,
  path: string,
  ttlSeconds: number = DEFAULT_READ_TTL_SECONDS
): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, ttlSeconds);
  if (error || !data) return null;
  return data.signedUrl;
}

/**
 * Create a signed URL for *uploading* an object. Returns null on
 * error. Use the returned `token` to PUT the file directly from the
 * browser without exposing the service role key.
 *
 * Supabase's `createSignedUploadUrl` returns `{ signedUrl, token, path }`.
 */
export async function createSignedUploadUrl(
  supabase: SupabaseClient,
  bucket: StorageBucket,
  path: string
): Promise<{ signedUrl: string; token: string; path: string } | null> {
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUploadUrl(path);
  if (error || !data) return null;
  return data;
}
