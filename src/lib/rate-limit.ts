/**
 * Token-bucket rate limiting for Server Actions and API routes.
 *
 * Two things matter here and they are easy to get wrong:
 *
 * 1. **The key must not be attacker-chosen.** A limiter keyed off the left-most
 *    `X-Forwarded-For` entry is no limiter at all — the caller sets that header
 *    and gets a fresh bucket per request. See `resolveClientIp`.
 * 2. **The store is per-process.** On a multi-instance or serverless deploy the
 *    buckets are per lambda and reset on cold start, so the real ceiling is
 *    roughly `limit × instances`. That closes casual abuse but not a determined
 *    attacker, so the store is swappable: implement `RateLimitStore` against
 *    Upstash Redis / Vercel KV and call `setRateLimitStore` from
 *    `instrumentation.ts`. Tracked in docs/11-cloud-handoff.md (D3).
 */

import { headers } from "next/headers";

interface RateLimitEntry {
  tokens: number;
  lastRefill: number;
}

/** Fully-resolved bucket shape, after defaults are applied. */
export interface RateLimitPolicy {
  /** Max tokens (requests) in the bucket. */
  maxTokens: number;
  /** Tokens added back per second. */
  refillRate: number;
}

/**
 * Backend for the buckets.
 *
 * `consume` takes one token for `key` and answers whether the caller may
 * proceed. It may be async so a network-backed store can drop straight in;
 * every caller already awaits.
 */
export interface RateLimitStore {
  consume(key: string, policy: RateLimitPolicy): boolean | Promise<boolean>;
}

/** Process-local store. Correct on a single instance, best-effort beyond it. */
export function createMemoryStore(): RateLimitStore {
  const buckets = new Map<string, RateLimitEntry>();

  return {
    consume(key, { maxTokens, refillRate }) {
      const now = Date.now();
      const entry = buckets.get(key);

      if (!entry) {
        buckets.set(key, { tokens: maxTokens - 1, lastRefill: now });
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
    },
  };
}

let store: RateLimitStore = createMemoryStore();

/**
 * Swap the backend — for a distributed store in production, or a deterministic
 * one in tests. Returns the previous store so a test can restore it.
 */
export function setRateLimitStore(next: RateLimitStore): RateLimitStore {
  const previous = store;
  store = next;
  return previous;
}

interface RateLimitOptions {
  /** Max tokens (requests) in the bucket. */
  maxTokens?: number;
  /** Tokens added back per second. */
  refillRate?: number;
  /** Identifier prefix, so two limiters never share a bucket. */
  prefix?: string;
}

/** Take a token for `identifier`. Resolves true when the request may proceed. */
export async function checkRateLimit(
  identifier: string,
  options: RateLimitOptions = {}
): Promise<boolean> {
  const { maxTokens = 10, refillRate = 1, prefix = "default" } = options;
  return store.consume(`${prefix}:${identifier}`, { maxTokens, refillRate });
}

/** Create a limiter with preset options. */
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
 * Headers a platform's own edge sets and overwrites, in preference order.
 *
 * Each is written by infrastructure in front of the app, which means a value
 * the client sent is discarded rather than appended to. `x-forwarded-for` is
 * deliberately absent — see `resolveClientIp`.
 */
const TRUSTED_IP_HEADERS = [
  "x-vercel-forwarded-for",
  "cf-connecting-ip",
  "true-client-ip",
  "fly-client-ip",
  "x-real-ip",
];

/**
 * How many proxies sit in front of the app and append to `X-Forwarded-For`.
 *
 * With the default of 0, the right-most entry is used: whatever our own edge
 * observed as the peer. Anything the caller put in the header is to the left of
 * that and ignored. Raise it only if you add another proxy in front — each hop
 * moves the trustworthy entry one position left, and setting it too high starts
 * trusting the caller again.
 */
function trustedProxyHops(): number {
  const parsed = Number.parseInt(process.env.TRUSTED_PROXY_HOPS ?? "0", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

/**
 * Resolve the caller's address from response headers.
 *
 * Split out as a pure function because getting it wrong is silent: the limiter
 * still looks like it works, it just never limits anyone.
 *
 * Returns `"unknown"` when nothing usable is present, which puts those callers
 * in one shared bucket. That throttles harder than intended rather than not at
 * all, which is the right way for this to fail.
 */
export function resolveClientIp(
  getHeader: (name: string) => string | null | undefined,
  options: { trustedHops?: number } = {}
): string {
  for (const name of TRUSTED_IP_HEADERS) {
    const value = getHeader(name)?.split(",")[0]?.trim();
    if (value) return value;
  }

  const forwarded = getHeader("x-forwarded-for");
  if (forwarded) {
    const chain = forwarded
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean);
    const hops = options.trustedHops ?? trustedProxyHops();
    const index = chain.length - 1 - hops;
    // A chain shorter than the configured hop count means the request didn't
    // come through the expected proxies — fall back to the right-most entry.
    return chain[index] ?? chain[chain.length - 1] ?? "unknown";
  }

  return "unknown";
}

/** The caller's address for the current request, for use as a bucket key. */
export async function getClientIp(): Promise<string> {
  const h = await headers();
  return resolveClientIp((name) => h.get(name));
}
