/**
 * Safe-redirect helpers for the Supabase auth callback.
 *
 * Two seams closed here (STUBS-TO-REPLACE Phase 0):
 *
 *   1. The callback used to trust `request.url`'s origin, which on
 *      misconfigured proxies derives from the client-controlled Host
 *      header. We pin redirects to `NEXT_PUBLIC_SITE_URL` when it is set,
 *      only falling back to the request origin in dev/preview where the
 *      env var may be absent.
 *
 *   2. The `next` query param used to flow into the redirect unchecked.
 *      We only honour same-site relative paths.
 */

/**
 * Resolve the origin to redirect to after auth. Prefers the configured
 * `NEXT_PUBLIC_SITE_URL` allow-list (production), falling back to the
 * request's own origin when unset or malformed (dev/preview).
 */
export function resolveCallbackOrigin(requestOrigin: string): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  if (!configured) return requestOrigin;
  try {
    // Normalise (strips trailing slashes, validates the URL).
    return new URL(configured).origin;
  } catch {
    return requestOrigin;
  }
}

/**
 * Sanitise a `next` redirect target: only same-site relative paths are
 * honoured; anything absolute, protocol-relative ("//evil.com") or
 * malformed collapses to "/".
 */
export function sanitiseNextPath(next: string | null | undefined): string {
  if (!next) return "/";
  if (!next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) {
    return "/";
  }
  return next;
}
