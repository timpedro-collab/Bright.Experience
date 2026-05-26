/**
 * Tests for the asset upload schema. Pins the file-type allow-list and
 * the 50 MB size cap.
 */

import { describe, it, expect } from "vitest";
import {
  assetUploadSchema,
  ALLOWED_FILE_TYPES,
  MAX_FILE_SIZE_MB,
} from "./assets";

const validUpload = {
  name: "Hero image",
  assetType: "image",
  fileType: "image/png",
  fileSizeBytes: 10 * 1024 * 1024,
};

describe("assetUploadSchema", () => {
  it("accepts a valid upload", () => {
    expect(() => assetUploadSchema.parse(validUpload)).not.toThrow();
  });

  it("rejects an empty name", () => {
    expect(() =>
      assetUploadSchema.parse({ ...validUpload, name: "" })
    ).toThrow(/Asset name is required/);
  });

  it("rejects an empty assetType", () => {
    expect(() =>
      assetUploadSchema.parse({ ...validUpload, assetType: "" })
    ).toThrow(/Asset type is required/);
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
