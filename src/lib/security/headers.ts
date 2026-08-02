/**
 * Response security headers, including the Content-Security-Policy.
 *
 * Imported by `next.config.ts` (not by application code) so the policy is a
 * tested pure function rather than a string literal buried in config. Every
 * allowed origin below is here because something in the app actually talks to
 * it — add a source only alongside the feature that needs it.
 *
 * Two flavours exist because `/venues/[slug]/embed` is *designed* to be put in
 * an iframe on a venue's own website. Everything else refuses framing outright.
 */

/** Cal.com serves the walkthrough booker embed script and its iframe. */
const CAL_ORIGINS = ["https://cal.com", "https://app.cal.com"];

/**
 * Origins Next.js is configured to optimise images from (`next.config.ts`
 * `images.remotePatterns`). The optimiser fetches server-side, but a
 * `next/image` with `unoptimized` or a plain `<img>` fetches in the browser.
 */
const IMAGE_ORIGINS = [
  "https://*.supabase.co",
  "https://*.supabase.in",
  "https://images.unsplash.com",
  "https://api.qrserver.com",
  "https://cdn.brightblue.com",
];

export interface SecurityHeaderOptions {
  /** Dev needs `unsafe-eval` (React error overlay) and websockets (HMR). */
  isDev?: boolean;
  /** `NEXT_PUBLIC_SUPABASE_URL` — REST, auth, realtime and storage all live here. */
  supabaseUrl?: string | null;
  /** `NEXT_PUBLIC_SENTRY_DSN` — the browser SDK posts events to its host. */
  sentryDsn?: string | null;
  /** Set for the venue embed route: allow any site to frame this response. */
  embeddable?: boolean;
}

/** One header as `next.config.ts` expects it. */
export interface HeaderEntry {
  key: string;
  value: string;
}

/** Origin of a URL, or null when the value is missing or unparseable. */
function originOf(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    return new URL(url).origin;
  } catch {
    return null;
  }
}

/**
 * Supabase realtime opens a websocket against the same host as the REST API,
 * which `connect-src` treats as a separate scheme.
 */
function websocketOrigin(httpOrigin: string): string {
  return httpOrigin.replace(/^http/, "ws");
}

/**
 * Build the Content-Security-Policy value.
 *
 * `script-src` carries `'unsafe-inline'`: the app ships an inline theme script
 * (`app/layout.tsx`) to stop a flash of the wrong palette, and Next inlines the
 * RSC flight payload on every response. The alternative is a per-request nonce,
 * which forces every page — including the static marketing pages — to render
 * dynamically. The policy still blocks the delivery vector that matters most:
 * script from an origin we didn't list.
 */
export function buildCsp(options: SecurityHeaderOptions = {}): string {
  const { isDev = false, embeddable = false } = options;

  const supabase = originOf(options.supabaseUrl);
  const sentry = originOf(options.sentryDsn);

  const connect = [
    "'self'",
    ...(supabase ? [supabase, websocketOrigin(supabase)] : []),
    "https://*.supabase.co",
    "wss://*.supabase.co",
    ...(sentry ? [sentry] : []),
    ...CAL_ORIGINS,
    // Turbopack's HMR channel and the dev overlay's fetches.
    ...(isDev ? ["ws:", "http://localhost:*", "http://127.0.0.1:*"] : []),
  ];

  const directives: Record<string, string[] | null> = {
    "default-src": ["'self'"],
    "base-uri": ["'self'"],
    "form-action": ["'self'"],
    // Nothing in the app embeds Flash/Java/PDF plugins, and this is the
    // directive that stops an uploaded SVG or PDF being run as an <object>.
    "object-src": ["'none'"],
    "frame-ancestors": embeddable ? ["*"] : ["'none'"],
    "script-src": [
      "'self'",
      "'unsafe-inline'",
      ...(isDev ? ["'unsafe-eval'"] : []),
      ...CAL_ORIGINS,
    ],
    // Tailwind ships a stylesheet, but Radix, Recharts and Framer Motion all
    // set element styles inline at runtime.
    "style-src": ["'self'", "'unsafe-inline'"],
    "img-src": [
      "'self'",
      // `data:` for inline QR/brand marks, `blob:` for local upload previews.
      "data:",
      "blob:",
      ...(supabase ? [supabase] : []),
      ...IMAGE_ORIGINS,
    ],
    "font-src": ["'self'", "data:"],
    "media-src": ["'self'", "blob:", ...(supabase ? [supabase] : [])],
    "connect-src": connect,
    "frame-src": ["'self'", ...CAL_ORIGINS],
    // pdf.js runs the PDF renderer in a worker served from /public.
    "worker-src": ["'self'", "blob:"],
    "manifest-src": ["'self'"],
    // Valueless directive — omitted locally, where there is no HTTPS to upgrade to.
    "upgrade-insecure-requests": isDev ? null : [],
  };

  return Object.entries(directives)
    .filter(([, sources]) => sources !== null)
    .map(([name, sources]) =>
      sources!.length ? `${name} ${sources!.join(" ")}` : name
    )
    .join("; ");
}

/**
 * The full header set for a response.
 *
 * HSTS is omitted in development: pinning `localhost` to HTTPS for two years
 * breaks every other local project on the machine.
 */
export function buildSecurityHeaders(
  options: SecurityHeaderOptions = {}
): HeaderEntry[] {
  const { isDev = false, embeddable = false } = options;

  return [
    { key: "Content-Security-Policy", value: buildCsp(options) },
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    {
      key: "Permissions-Policy",
      value: "camera=(), microphone=(), geolocation=(self)",
    },
    { key: "X-DNS-Prefetch-Control", value: "on" },
    // Legacy equivalent of frame-ancestors, for browsers that predate CSP 2.
    // There is no "allow any site" value, so the embed route simply omits it.
    ...(embeddable
      ? []
      : [{ key: "X-Frame-Options", value: "DENY" } satisfies HeaderEntry]),
    ...(isDev
      ? []
      : [
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          } satisfies HeaderEntry,
        ]),
  ];
}
