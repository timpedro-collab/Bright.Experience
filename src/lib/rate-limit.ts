/** In-memory token bucket rate limiter for Server Actions and API routes */

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
