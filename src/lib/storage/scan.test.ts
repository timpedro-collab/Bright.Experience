/**
 * Tests for the upload screen.
 *
 * `screenUpload` is the one call every upload path makes, so what matters is
 * that the SVG refusal happens *before* the network scan and that a missing or
 * broken scanner never blocks a customer's artwork.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

import { screenUpload, scanUpload } from "./scan";

/** Bytes of a file as the action reads them. */
function bytes(content: string): Uint8Array {
  return new TextEncoder().encode(content);
}

const CLEAN_PNG = bytes("\x89PNG fake bytes");
const HOSTILE_SVG = bytes(`<svg onload="alert(1)"><path d="M0 0"/></svg>`);
const CLEAN_SVG = bytes(`<svg viewBox="0 0 10 10"><path d="M0 0"/></svg>`);

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn());
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("screenUpload", () => {
  it("refuses an SVG with an event handler without calling the scanner", async () => {
    vi.stubEnv("FILE_SCAN_URL", "https://scanner.test/scan");

    const result = await screenUpload(HOSTILE_SVG, "logo.svg", "image/svg+xml");

    expect(result.ok).toBe(false);
    expect(result.detail).toMatch(/event handler/i);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("passes a clean SVG through to the scanner", async () => {
    vi.stubEnv("FILE_SCAN_URL", "https://scanner.test/scan");
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ clean: true }), { status: 200 })
    );

    const result = await screenUpload(CLEAN_SVG, "logo.svg", "image/svg+xml");

    expect(result.ok).toBe(true);
    expect(fetch).toHaveBeenCalledOnce();
  });

  it("does not read a PNG as markup", async () => {
    const result = await screenUpload(CLEAN_PNG, "hero.png", "image/png");

    expect(result).toEqual({ ok: true, skipped: true });
  });

  it("skips the scan when no scanner is configured", async () => {
    vi.stubEnv("FILE_SCAN_URL", "");

    const result = await screenUpload(CLEAN_PNG, "hero.png", "image/png");

    expect(result).toEqual({ ok: true, skipped: true });
    expect(fetch).not.toHaveBeenCalled();
  });
});

describe("scanUpload", () => {
  it("reports the signature when the scanner finds something", async () => {
    vi.stubEnv("FILE_SCAN_URL", "https://scanner.test/scan");
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ clean: false, signature: "Eicar-Test" }), {
        status: 200,
      })
    );

    const result = await scanUpload(CLEAN_PNG, "hero.png");

    expect(result.ok).toBe(false);
    expect(result.detail).toContain("Eicar-Test");
  });

  it("fails open when the scanner is unreachable, so uploads keep working", async () => {
    vi.stubEnv("FILE_SCAN_URL", "https://scanner.test/scan");
    vi.mocked(fetch).mockRejectedValue(new Error("connect ECONNREFUSED"));

    const result = await scanUpload(CLEAN_PNG, "hero.png");

    expect(result).toMatchObject({ ok: true, skipped: true });
  });

  it("fails open on a scanner error response", async () => {
    vi.stubEnv("FILE_SCAN_URL", "https://scanner.test/scan");
    vi.mocked(fetch).mockResolvedValue(new Response("nope", { status: 503 }));

    const result = await scanUpload(CLEAN_PNG, "hero.png");

    expect(result).toMatchObject({ ok: true, skipped: true });
    expect(result.detail).toContain("503");
  });
});
