/** Zod schemas for asset upload validation */
import { z } from "zod";
import { uuidLike } from "./id";

/**
 * Canonical allow-list for event-asset uploads. The `event-assets` storage
 * bucket constraints (`src/lib/storage/signed-url.ts`) derive from these
 * constants so the schema and the bucket can never drift apart.
 */
export const ALLOWED_FILE_TYPES = [
  "image/png",
  "image/jpeg",
  "image/svg+xml",
  "image/webp",
  "application/pdf",
  "video/mp4",
  "video/quicktime",
] as const;

export const MAX_FILE_SIZE_MB = 50;

/** Structured input for `uploadAsset` — ids plus the staged file's metadata. */
export const assetUploadSchema = z.object({
  assetId: uuidLike("Invalid asset ID"),
  eventId: uuidLike("Invalid event ID"),
  fileName: z.string().min(1, "File name is required"),
  fileType: z.string().refine(
    (val) => (ALLOWED_FILE_TYPES as readonly string[]).includes(val),
    "Unsupported file format"
  ),
  fileSizeBytes: z
    .number()
    .max(MAX_FILE_SIZE_MB * 1024 * 1024, `File must be under ${MAX_FILE_SIZE_MB}MB`),
});

export type AssetUploadInput = z.infer<typeof assetUploadSchema>;
