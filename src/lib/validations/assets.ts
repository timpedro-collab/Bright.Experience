/** Zod schemas for asset upload validation */
import { z } from "zod";

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

export const assetUploadSchema = z.object({
  name: z.string().min(1, "Asset name is required"),
  assetType: z.string().min(1, "Asset type is required"),
  fileType: z.string().refine(
    (val) => (ALLOWED_FILE_TYPES as readonly string[]).includes(val),
    "Unsupported file format"
  ),
  fileSizeBytes: z
    .number()
    .max(MAX_FILE_SIZE_MB * 1024 * 1024, `File must be under ${MAX_FILE_SIZE_MB}MB`),
});

export type AssetUploadInput = z.infer<typeof assetUploadSchema>;
