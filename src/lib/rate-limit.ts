/**
 * In-memory token bucket rate limiter for Server Actions and API routes.
 *
 * NOTE: the store is per-instance process memory, so on serverless/multi-
 * instance deploys it does not share state across instances and resets on
 * cold start. This closes the abuse hole immediately; a distributed store
 * (Upstash Redis / Vercel KV) behind `checkRateLimit` is tracked as a
 * dev-team handoff item in docs/11-cloud-handoff.md (D3).
 */

import { headers } from "next/headers";

interface RateLimitEntry {
  tokens: number;
  lastRefill: number;
}

const store = new Map<string, RateLimitEntry>();

interface RateLimitOptions {
  /** Max tokens (requests) in the bucket */
  maxTokens?: number;
  /** Refill rate: tokens added per second */
  refillRate?: number;
  /** Identifier prefix for namespacing different limiters */
  prefix?: string;
}

/** Check if a request should be allowed. Returns true if allowed, false if rate-limited. */
export function checkRateLimit(
  identifier: string,
  options: RateLimitOptions = {}
): boolean {
  const { maxTokens = 10, refillRate = 1, prefix = "default" } = options;
  const key = `${prefix}:${identifier}`;
  const now = Date.now();
  const entry = store.get(key);

  if (!entry) {
    store.set(key, { tokens: maxTokens - 1, lastRefill: now });
    return true;
  }

  const elapsed = (now - entry.lastRefill) / 1000;
  const refilled = Math.min(maxTokens, entry.tokens + elapsed * refillRate);
  entry.lastRefill = now;

  if (refilled < 1) {
    entry.tokens = refilled;
    return false;
  }

  entry.tokens = refilled - 1;
  return true;
}

/** Create a scoped rate limiter with preset options */
export function createRateLimiter(options: RateLimitOptions) {
  return (identifier: string) => checkRateLimit(identifier, options);
}

export const authLimiter = createRateLimiter({
  maxTokens: 5,
  refillRate: 0.1,
  prefix: "auth",
});

export const quoteLimiter = createRateLimiter({
  maxTokens: 10,
  refillRate: 0.5,
  prefix: "quote",
});

/** Public partner applications — low volume by nature, tight bucket. */
export const applicationLimiter = createRateLimiter({
  maxTokens: 5,
  refillRate: 0.1,
  prefix: "apply",
});

/**
 * Public proposal-page mutations (accept/decline/walkthrough/capability
 * edits). These take a raw quote id from an unauthenticated page, so the
 * limiter also blunts id-enumeration probing.
 */
export const decisionLimiter = createRateLimiter({
  maxTokens: 10,
  refillRate: 0.5,
  prefix: "decision",
});

/**
 * Best-effort caller IP for rate-limit keys. Reads the proxy-forwarded
 * headers Vercel/most platforms set. Falls back to "unknown" so a missing
 * header degrades to a shared bucket rather than throwing.
 */
export async function getClientIp(): Promise<string> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return h.get("x-real-ip") ?? "unknown";
}
