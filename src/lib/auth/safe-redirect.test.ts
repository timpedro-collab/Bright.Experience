/**
 * Tests for the auth-callback safe-redirect helpers — the contract is that
 * redirects stay pinned to the configured site origin and `next` can never
 * escape to another host.
 */
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { resolveCallbackOrigin, sanitiseNextPath } from "./safe-redirect";

const ORIGINAL_SITE_URL = process.env.NEXT_PUBLIC_SITE_URL;

afterEach(() => {
  if (ORIGINAL_SITE_URL === undefined) {
    delete process.env.NEXT_PUBLIC_SITE_URL;
  } else {
    process.env.NEXT_PUBLIC_SITE_URL = ORIGINAL_SITE_URL;
  }
});

describe("resolveCallbackOrigin", () => {
  beforeEach(() => {
    delete process.env.NEXT_PUBLIC_SITE_URL;
  });

  it("pins to NEXT_PUBLIC_SITE_URL when configured, ignoring the request origin", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://portal.bright.blue";
    expect(resolveCallbackOrigin("https://evil.example")).toBe(
      "https://portal.bright.blue"
    );
  });

  it("normalises a configured URL with a path or trailing slash to its origin", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://portal.bright.blue/app/";
    expect(resolveCallbackOrigin("https://evil.example")).toBe(
      "https://portal.bright.blue"
    );
  });

  it("falls back to the request origin when unset (dev/preview)", () => {
    expect(resolveCallbackOrigin("http://localhost:3000")).toBe(
      "http://localhost:3000"
    );
  });

  it("falls back to the request origin when the configured value is malformed", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "not-a-url";
    expect(resolveCallbackOrigin("http://localhost:3000")).toBe(
      "http://localhost:3000"
    );
  });
});

describe("sanitiseNextPath", () => {
  it("honours same-site relative paths", () => {
    expect(sanitiseNextPath("/events/abc")).toBe("/events/abc");
    expect(sanitiseNextPath("/auth/set-password")).toBe("/auth/set-password");
  });

  it("collapses absolute URLs to /", () => {
    expect(sanitiseNextPath("https://evil.example/phish")).toBe("/");
  });

  it("collapses protocol-relative and backslash tricks to /", () => {
    expect(sanitiseNextPath("//evil.example")).toBe("/");
    expect(sanitiseNextPath("/\\evil.example")).toBe("/");
  });

  it("collapses empty and missing values to /", () => {
    expect(sanitiseNextPath(null)).toBe("/");
    expect(sanitiseNextPath(undefined)).toBe("/");
    expect(sanitiseNextPath("")).toBe("/");
  });
});
