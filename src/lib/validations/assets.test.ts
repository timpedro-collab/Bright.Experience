/**
 * Tests for the asset upload schema. Pins the file-type allow-list and
 * the 50 MB size cap, plus the id/file-metadata shape `uploadAsset` uses.
 */

import { describe, it, expect } from "vitest";
import {
  assetUploadSchema,
  ALLOWED_FILE_TYPES,
  MAX_FILE_SIZE_MB,
} from "./assets";

const validUpload = {
  assetId: "a1f00000-0000-4000-8000-000000000001",
  eventId: "e1111111-1111-1111-1111-111111111111",
  fileName: "hero-image.png",
  fileType: "image/png",
  fileSizeBytes: 10 * 1024 * 1024,
};

describe("assetUploadSchema", () => {
  it("accepts a valid upload", () => {
    expect(() => assetUploadSchema.parse(validUpload)).not.toThrow();
  });

  it("rejects a non-uuid asset id", () => {
    expect(() =>
      assetUploadSchema.parse({ ...validUpload, assetId: "not-a-uuid" })
    ).toThrow(/Invalid asset ID/);
  });

  it("rejects a non-uuid event id", () => {
    expect(() =>
      assetUploadSchema.parse({ ...validUpload, eventId: "nope" })
    ).toThrow(/Invalid event ID/);
  });

  it("rejects an empty file name", () => {
    expect(() =>
      assetUploadSchema.parse({ ...validUpload, fileName: "" })
    ).toThrow(/File name is required/);
  });

  it("rejects unsupported MIME types", () => {
    expect(() =>
      assetUploadSchema.parse({ ...validUpload, fileType: "application/zip" })
    ).toThrow(/Unsupported file format/);
  });

  it("accepts every allow-listed MIME type", () => {
    for (const t of ALLOWED_FILE_TYPES) {
      expect(() =>
        assetUploadSchema.parse({ ...validUpload, fileType: t })
      ).not.toThrow();
    }
  });

  it("rejects files over the size cap", () => {
    expect(() =>
      assetUploadSchema.parse({
        ...validUpload,
        fileSizeBytes: (MAX_FILE_SIZE_MB + 1) * 1024 * 1024,
      })
    ).toThrow(new RegExp(`under ${MAX_FILE_SIZE_MB}MB`));
  });
});
