import { describe, it, expect } from "vitest";
import {
  validateUpload,
  storagePathFor,
  BUCKET_CONSTRAINTS,
} from "./signed-url";

describe("validateUpload", () => {
  it("accepts a PNG into event-assets", () => {
    const result = validateUpload("event-assets", {
      type: "image/png",
      size: 1024 * 1024,
      name: "hero.png",
    });
    expect(result).toEqual({ ok: true });
  });

  it("rejects an oversize file with reason=size", () => {
    const result = validateUpload("event-assets", {
      type: "image/png",
      size: BUCKET_CONSTRAINTS["event-assets"].maxBytes + 1,
      name: "hero.png",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("size");
  });

  it("rejects a disallowed MIME with reason=mime", () => {
    const result = validateUpload("event-assets", {
      type: "application/x-msdownload",
      size: 100,
      name: "totally-not-malware.exe",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("mime");
  });

  it("only enforces size for the wildcard briefings bucket", () => {
    const result = validateUpload("briefings", {
      type: "application/x-some-format",
      size: 1024,
      name: "kit.zip",
    });
    expect(result.ok).toBe(true);
  });

  it("reports the missing content type with a helpful detail", () => {
    const result = validateUpload("event-assets", {
      size: 100,
      name: "file",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.detail).toMatch(/content type/);
  });
});

describe("storagePathFor", () => {
  it("uses eventId/entityType/entityId as the namespace", () => {
    const path = storagePathFor({
      eventId: "e1",
      entityType: "asset",
      entityId: "a1",
      filename: "logo.png",
    });
    expect(path.startsWith("e1/asset/a1/")).toBe(true);
    expect(path.endsWith("-logo.png")).toBe(true);
  });

  it("sanitises filenames with unsafe characters", () => {
    const path = storagePathFor({
      eventId: "e1",
      entityType: "asset",
      entityId: "a1",
      filename: "hello world (1).PNG",
    });
    expect(path).toMatch(/hello_world__1_\.PNG$/);
  });

  it("truncates very long filenames", () => {
    const longName = "a".repeat(500) + ".png";
    const path = storagePathFor({
      eventId: "e1",
      entityType: "asset",
      entityId: "a1",
      filename: longName,
    });
    expect(path.length).toBeLessThan(300);
  });
});
