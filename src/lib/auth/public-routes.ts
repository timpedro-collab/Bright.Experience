/**
 * The single definition of which paths render without a session.
 *
 * Used by `src/middleware.ts`. It lives here rather than inline so it can be
 * tested: the previous version matched with a bare `startsWith`, which meant
 * any future route sharing a prefix with a public one — `/reports`,
 * `/bookings`, `/help-desk-admin` — would have been silently exempt from the
 * auth gate. Matching is now exact, or a prefix followed by `/`.
 *
 * Being listed here is not the same as being unauthenticated: the tokened
 * routes (`/report/:token`, `/sponsor/:token`, `/live/:token`, `/p/:code`) are capability
 * URLs whose token is validated server-side, and the machine-to-machine
 * routes enforce HMAC or a bearer secret in their handlers. This list only
 * says "the session cookie gate does not apply".
 */

/** Matched exactly, or as a prefix when the next character is `/`. */
const PUBLIC_ROUTES = [
  // Auth entry points
  "/login",
  "/auth",
  "/forgot-password",
  // Public marketing + catalogue
  "/catalog",
  "/how-it-works",
  "/help",
  "/quiz",
  "/terms",
  "/privacy",
  "/partners/join",
  "/pricing",
  "/for-venues",
  "/for-organizers",
  "/business-case",
  "/faq",
  "/measured-sampling",
  "/bright-index",
  "/state-of-play",
  "/llm-info",
  "/llms.txt",
  // Static asset folders under public/ that middleware still sees
  "/resources",
  "/presentation",
  // Self-serve buying funnel
  "/book",
  "/proposal",
  // Capability URLs — the token in the path is the credential and is
  // validated server-side by the page's query.
  "/p",
  "/report",
  "/sponsor",
  "/live",
  // Player result card — the unguessable lead UUID is the credential,
  // validated by the page's service-role query.
  "/play",
  // Partner pricing microsites — the unguessable slug is the credential,
  // validated against the page's static registry (unknown slugs 404).
  "/pp",
  // Machine-to-machine endpoints that can never carry a browser session:
  // inbound Cloud/Cal.com webhooks (HMAC) and scheduled crons (CRON_SECRET
  // bearer). Without these the session gate 307s the caller to /login and
  // the payload is silently dropped.
  "/api/webhooks",
  "/api/cron",
  // Journey email tracking (open pixel + click redirect). The caller is a
  // mail client; the capability is the unguessable journey+lead UUID pair,
  // validated in the handler.
  "/api/journeys",
  // The public MCP server: AI assistants speaking Model Context Protocol.
  // Read tools expose only already-public marketing data; the write tool
  // reuses the rate-limited public proposal intake.
  "/api/mcp",
  // Uptime probe. The public payload is a status summary; the detail is
  // gated on the CRON_SECRET bearer inside the handler.
  "/api/health",
  // Test-only login/reset. Rewritten to a 404 at the framework level unless
  // ALLOW_TEST_AUTH_ROUTES is set — see next.config.ts.
  "/api/test",
] as const;

/** Public routes whose shape needs a pattern rather than a fixed prefix. */
const PUBLIC_PATTERNS = [
  // A venue's public advertiser page, which venues iframe into their own site.
  /^\/venues\/[^/]+\/advertise$/,
  // The compact embeddable widget — same public-by-path model as /advertise.
  /^\/venues\/[^/]+\/widget$/,
  // PDF export of the public proposal page — same capability-URL model as
  // /proposal/:id itself (the unguessable quote UUID is the credential).
  /^\/api\/quotes\/[^/]+\/proposal-pdf$/,
  // Share exports of the public report — the share token in the path is the
  // credential, validated in each handler before anything renders.
  /^\/api\/reports\/[^/]+\/(stat-card|slide-pdf|wrapped-card)$/,
  // The player result share image — same lead-UUID capability as /play/:id.
  /^\/api\/play\/[^/]+\/card$/,
];

/** Strip a trailing slash so `/catalog/` and `/catalog` behave identically. */
function normalise(pathname: string): string {
  if (pathname.length > 1 && pathname.endsWith("/")) return pathname.slice(0, -1);
  return pathname;
}

/**
 * True when the path may be served without a session.
 * The site root is public (it renders the marketing page for signed-out
 * visitors and the dashboard for signed-in ones).
 */
export function isPublicPath(pathname: string): boolean {
  const path = normalise(pathname);
  if (path === "/") return true;
  for (const route of PUBLIC_ROUTES) {
    if (path === route || path.startsWith(`${route}/`)) return true;
  }
  return PUBLIC_PATTERNS.some((pattern) => pattern.test(path));
}
