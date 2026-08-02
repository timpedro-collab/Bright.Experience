import { describe, it, expect, vi } from "vitest";
import {
  validateUpload,
  storagePathFor,
  mustDownloadInsteadOfRender,
  createSignedReadUrl,
  BUCKET_CONSTRAINTS,
} from "./signed-url";
import type { SupabaseClient } from "@supabase/supabase-js";

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

describe("mustDownloadInsteadOfRender", () => {
  it("flags the file types that execute when a browser opens them", () => {
    expect(mustDownloadInsteadOfRender("e1/asset/a1/logo.svg")).toBe(true);
    expect(mustDownloadInsteadOfRender("e1/asset/a1/LOGO.SVG")).toBe(true);
    expect(mustDownloadInsteadOfRender("e1/asset/a1/deck.html")).toBe(true);
    expect(mustDownloadInsteadOfRender("e1/asset/a1/data.xml")).toBe(true);
  });

  it("leaves ordinary media alone", () => {
    expect(mustDownloadInsteadOfRender("e1/asset/a1/hero.png")).toBe(false);
    expect(mustDownloadInsteadOfRender("e1/asset/a1/spec.pdf")).toBe(false);
    expect(mustDownloadInsteadOfRender("e1/asset/a1/reel.mp4")).toBe(false);
  });

  it("is not fooled by a query string after the extension", () => {
    expect(mustDownloadInsteadOfRender("e1/a/logo.svg?token=abc")).toBe(true);
    expect(mustDownloadInsteadOfRender("e1/a/hero.png?name=x.svg")).toBe(false);
  });
});

/** A Supabase stub that records what `createSignedUrl` was asked for. */
function stubStorage() {
  const createSignedUrl = vi.fn(async () => ({
    data: { signedUrl: "https://storage.test/signed" },
    error: null,
  }));
  const supabase = {
    storage: { from: () => ({ createSignedUrl }) },
  } as unknown as SupabaseClient;
  return { supabase, createSignedUrl };
}

describe("createSignedReadUrl", () => {
  it("signs an SVG so the browser downloads it instead of running it", async () => {
    const { supabase, createSignedUrl } = stubStorage();

    await createSignedReadUrl(supabase, "event-assets", "e1/asset/a1/logo.svg");

    expect(createSignedUrl).toHaveBeenCalledWith(
      "e1/asset/a1/logo.svg",
      3600,
      { download: true }
    );
  });

  it("leaves an image inline so previews keep working", async () => {
    const { supabase, createSignedUrl } = stubStorage();

    const url = await createSignedReadUrl(
      supabase,
      "event-assets",
      "e1/asset/a1/hero.png"
    );

    expect(createSignedUrl).toHaveBeenCalledWith(
      "e1/asset/a1/hero.png",
      3600,
      undefined
    );
    expect(url).toBe("https://storage.test/signed");
  });
});
