/** Next.js configuration — security headers, image domains, and prod tweaks */
import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

import { buildSecurityHeaders } from "./src/lib/security/headers";
import { isPublicApiEnabled } from "./src/lib/integration-flags";

// The policy is derived, not hard-coded: Supabase and Sentry live on different
// hosts per environment, and the local stack is plain HTTP on 127.0.0.1.
const headerOptions = {
  isDev: process.env.NODE_ENV !== "production",
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
  sentryDsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
};

const securityHeaders = buildSecurityHeaders(headerOptions);

// A venue's public advertiser page is the widget venues paste into their own
// site (`/venues/[slug]/embed` generates that iframe snippet and previews it),
// so it is the one route that must be frameable. Next merges every matching
// `headers()` entry and offers no way to *remove* a header a broader rule has
// set, so the broad rule excludes this path and it gets its own header set.
const embedSecurityHeaders = buildSecurityHeaders({
  ...headerOptions,
  embeddable: true,
});

const FRAMEABLE_PATH = "/venues/:slug/advertise";
/** Everything else, so the two header sets never overlap on one response. */
const NON_FRAMEABLE_PATHS = "/:path((?!venues\\/[^/]+\\/advertise$).*)";

// Allow Next.js Image to optimise from these origins. Add more as needed.
const remoteImagePatterns: NextConfig["images"] = {
  remotePatterns: [
    { protocol: "https", hostname: "*.supabase.co", pathname: "/storage/**" },
    { protocol: "https", hostname: "*.supabase.in", pathname: "/storage/**" },
    { protocol: "https", hostname: "images.unsplash.com" },
    { protocol: "https", hostname: "api.qrserver.com" },
    { protocol: "https", hostname: "cdn.brightblue.com" },
  ],
  formats: ["image/avif", "image/webp"],
};

// `/api/test/*` signs a user in as a named persona using the service role. It is
// in the middleware's public allowlist, so the only thing standing between it and
// an unauthenticated session was a `TEST_MODE` env check — one stray environment
// variable away from an auth bypass.
//
// A production build now drops the routes from the routing table entirely. The
// E2E harness builds in production mode, so it opts back in with a second,
// separately-named variable: a deployment that inherits `TEST_MODE=1` from a CI
// config still 404s.
const testRoutesEnabled =
  process.env.NODE_ENV !== "production" ||
  process.env.ALLOW_TEST_AUTH_ROUTES === "1";

const publicApiEnabled = isPublicApiEnabled();

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  images: remoteImagePatterns,
  // The PDF export route launches headless Chromium at runtime. The bundler
  // must not relocate these packages or the chromium binary directory is
  // missing from the deployed function (`/var/task/.../chromium/bin`).
  serverExternalPackages: ["@sparticuz/chromium", "puppeteer-core"],
  // Externalizing keeps the import resolvable, but Vercel's file tracing
  // still has to ship the compressed browser binaries with the function —
  // they are opened with plain fs reads that tracing cannot see. The key is
  // a picomatch glob: `[id]` would parse as a character class, so the
  // dynamic segment is matched with `*` instead.
  outputFileTracingIncludes: {
    "/api/quotes/*/proposal-pdf": [
      "./node_modules/@sparticuz/chromium/bin/**/*",
    ],
  },
  async rewrites() {
    // Rewriting to a path with no route makes Next render not-found with a real
    // 404 status, so the target is unreachable no matter what its handler does.
    //
    // These must be `beforeFiles`. A bare array is `afterFiles`, which Next only
    // consults once the filesystem has been checked — so it can never shadow a
    // route that exists, which is the entire point here.
    const disabled: { source: string; destination: string }[] = [];

    if (!testRoutesEnabled) {
      disabled.push({
        source: "/api/test/:path*",
        destination: "/_disabled-route",
      });
    }

    // Keys and webhook subscriptions nothing consumes yet — see
    // `lib/integration-flags.ts`.
    if (!publicApiEnabled) {
      disabled.push({ source: "/admin/api", destination: "/_disabled-route" });
    }

    return { beforeFiles: disabled, afterFiles: [], fallback: [] };
  },
  // Allow the dev server's client JS bundles (/_next/*) to load when the app is
  // opened from a LAN IP on a phone/tablet. Without this, Next.js 16 blocks
  // cross-origin dev resources so the page renders but never hydrates (dead taps).
  // Add whatever host you use for on-device testing here.
  allowedDevOrigins: ["192.168.1.*", "192.168.86.*", "172.16.*", "localhost"],
  async headers() {
    return [
      {
        source: NON_FRAMEABLE_PATHS,
        headers: securityHeaders,
      },
      {
        source: FRAMEABLE_PATH,
        headers: embedSecurityHeaders,
      },
      {
        // Capability URL: the link is the credential, so keep it out of search
        // indexes at the transport layer too, not only via page metadata.
        source: "/sponsor/:token*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" }],
      },
    ];
  },
};

export default withSentryConfig(nextConfig, {
  silent: true,
  org: process.env.SENTRY_ORG ?? "",
  project: process.env.SENTRY_PROJECT ?? "",
  widenClientFileUpload: true,
  sourcemaps: {
    filesToDeleteAfterUpload: [".next/static/**/*.map"],
  },
  disableLogger: true,
});
