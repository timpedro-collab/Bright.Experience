/**
 * Tests for the response security headers.
 *
 * The policy is what stands between an injected string and a working XSS, and
 * one wrong directive silently breaks a whole feature (Supabase realtime, the
 * Cal.com booker, the venue embed). Both failure modes are asserted here.
 */
import { describe, it, expect } from "vitest";

import { buildCsp, buildSecurityHeaders } from "./headers";

const PROD = {
  isDev: false,
  supabaseUrl: "https://abcdefgh.supabase.co",
  sentryDsn: "https://key@o4507.ingest.de.sentry.io/123",
};

/** Sources listed for one directive, in order. */
function directive(csp: string, name: string): string[] {
  const found = csp
    .split(";")
    .map((part) => part.trim())
    .find((part) => part === name || part.startsWith(`${name} `));
  if (!found) return [];
  return found.split(/\s+/).slice(1);
}

function headerValue(
  headers: ReturnType<typeof buildSecurityHeaders>,
  key: string
): string | undefined {
  return headers.find((h) => h.key === key)?.value;
}

describe("buildCsp", () => {
  it("locks everything to the app's own origin by default", () => {
    const csp = buildCsp(PROD);

    expect(directive(csp, "default-src")).toEqual(["'self'"]);
    expect(directive(csp, "base-uri")).toEqual(["'self'"]);
    expect(directive(csp, "form-action")).toEqual(["'self'"]);
    expect(directive(csp, "object-src")).toEqual(["'none'"]);
  });

  it("refuses to be framed unless the route is an embed", () => {
    expect(directive(buildCsp(PROD), "frame-ancestors")).toEqual(["'none'"]);
    expect(
      directive(buildCsp({ ...PROD, embeddable: true }), "frame-ancestors")
    ).toEqual(["*"]);
  });

  it("lets the browser reach Supabase over both HTTP and websockets", () => {
    const connect = directive(buildCsp(PROD), "connect-src");

    expect(connect).toContain("https://abcdefgh.supabase.co");
    expect(connect).toContain("wss://abcdefgh.supabase.co");
  });

  it("points Sentry at the DSN's host, not a guess", () => {
    const connect = directive(buildCsp(PROD), "connect-src");

    expect(connect).toContain("https://o4507.ingest.de.sentry.io");
  });

  it("survives a malformed or missing Supabase URL", () => {
    const csp = buildCsp({ isDev: false, supabaseUrl: "not-a-url" });

    expect(directive(csp, "connect-src")).toContain("'self'");
    expect(csp).not.toContain("not-a-url");
  });

  it("allows the Cal.com booker to load and to be framed", () => {
    const csp = buildCsp(PROD);

    expect(directive(csp, "script-src")).toContain("https://app.cal.com");
    expect(directive(csp, "frame-src")).toContain("https://cal.com");
  });

  it("allows blob previews and data URIs for images, and the pdf.js worker", () => {
    const csp = buildCsp(PROD);

    expect(directive(csp, "img-src")).toEqual(
      expect.arrayContaining(["data:", "blob:"])
    );
    expect(directive(csp, "worker-src")).toEqual(
      expect.arrayContaining(["'self'", "blob:"])
    );
  });

  it("keeps unsafe-eval and the HMR socket out of production", () => {
    const csp = buildCsp(PROD);

    expect(directive(csp, "script-src")).not.toContain("'unsafe-eval'");
    expect(directive(csp, "connect-src")).not.toContain("ws:");
    expect(csp).toContain("upgrade-insecure-requests");
  });

  it("adds them back in development, where the overlay and HMR need them", () => {
    const csp = buildCsp({ ...PROD, isDev: true });

    expect(directive(csp, "script-src")).toContain("'unsafe-eval'");
    expect(directive(csp, "connect-src")).toContain("ws:");
    // Nothing to upgrade to over plain-HTTP localhost.
    expect(csp).not.toContain("upgrade-insecure-requests");
  });

  it("emits directives as a single header value", () => {
    const csp = buildCsp(PROD);

    expect(csp).not.toContain("\n");
    expect(csp.split(";").length).toBeGreaterThan(10);
  });
});

describe("buildSecurityHeaders", () => {
  it("ships the CSP alongside the older hardening headers", () => {
    const headers = buildSecurityHeaders(PROD);

    expect(headerValue(headers, "Content-Security-Policy")).toContain(
      "default-src 'self'"
    );
    expect(headerValue(headers, "X-Content-Type-Options")).toBe("nosniff");
    expect(headerValue(headers, "Referrer-Policy")).toBe(
      "strict-origin-when-cross-origin"
    );
    expect(headerValue(headers, "Permissions-Policy")).toContain("camera=()");
  });

  it("asks browsers to stay on HTTPS in production", () => {
    const hsts = headerValue(buildSecurityHeaders(PROD), "Strict-Transport-Security");

    expect(hsts).toContain("max-age=63072000");
    expect(hsts).toContain("includeSubDomains");
  });

  it("never pins localhost to HTTPS", () => {
    const headers = buildSecurityHeaders({ ...PROD, isDev: true });

    expect(headerValue(headers, "Strict-Transport-Security")).toBeUndefined();
  });

  it("denies framing everywhere except the venue embed", () => {
    expect(headerValue(buildSecurityHeaders(PROD), "X-Frame-Options")).toBe("DENY");
    // No X-Frame-Options value means "any site", so the embed omits the header.
    expect(
      headerValue(buildSecurityHeaders({ ...PROD, embeddable: true }), "X-Frame-Options")
    ).toBeUndefined();
  });
});
