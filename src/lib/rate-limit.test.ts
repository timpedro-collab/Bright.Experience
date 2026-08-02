/**
 * Tests for the token-bucket rate limiter that guards the public server-action
 * entry points (auth, quote intake, partner apply, proposal decisions).
 *
 * The load-bearing case is `resolveClientIp`: if the key can be chosen by the
 * caller, every other test here passes while the limiter limits nobody.
 */

import { describe, it, expect, vi, afterEach } from "vitest";
import { headers } from "next/headers";
import {
  checkRateLimit,
  createRateLimiter,
  createMemoryStore,
  setRateLimitStore,
  resolveClientIp,
  getClientIp,
  type RateLimitStore,
} from "./rate-limit";

/** Header lookup over a plain object, as the resolver expects. */
function headerReader(values: Record<string, string>) {
  return (name: string) => values[name] ?? null;
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("checkRateLimit", () => {
  it("allows up to maxTokens requests then blocks", async () => {
    const opts = { maxTokens: 3, refillRate: 0, prefix: "t-basic" };
    expect(await checkRateLimit("a", opts)).toBe(true);
    expect(await checkRateLimit("a", opts)).toBe(true);
    expect(await checkRateLimit("a", opts)).toBe(true);
    expect(await checkRateLimit("a", opts)).toBe(false);
  });

  it("keeps buckets separate per identifier and per prefix", async () => {
    const opts = { maxTokens: 1, refillRate: 0, prefix: "t-scope" };
    expect(await checkRateLimit("ip-1", opts)).toBe(true);
    expect(await checkRateLimit("ip-1", opts)).toBe(false);
    // Different identifier: fresh bucket.
    expect(await checkRateLimit("ip-2", opts)).toBe(true);
    // Same identifier, different prefix: fresh bucket.
    expect(await checkRateLimit("ip-1", { ...opts, prefix: "t-scope-other" })).toBe(
      true
    );
  });

  it("refills tokens over time", async () => {
    vi.useFakeTimers();
    try {
      const opts = { maxTokens: 1, refillRate: 1, prefix: "t-refill" };
      expect(await checkRateLimit("a", opts)).toBe(true);
      expect(await checkRateLimit("a", opts)).toBe(false);
      vi.advanceTimersByTime(1100);
      expect(await checkRateLimit("a", opts)).toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });

  it("createRateLimiter presets the options", async () => {
    const limiter = createRateLimiter({
      maxTokens: 2,
      refillRate: 0,
      prefix: "t-preset",
    });
    expect(await limiter("x")).toBe(true);
    expect(await limiter("x")).toBe(true);
    expect(await limiter("x")).toBe(false);
  });
});

describe("setRateLimitStore", () => {
  it("routes every decision through the swapped-in store", async () => {
    const consume = vi.fn(async () => false);
    const previous = setRateLimitStore({ consume } satisfies RateLimitStore);

    try {
      const allowed = await checkRateLimit("203.0.113.1", {
        maxTokens: 5,
        refillRate: 1,
        prefix: "t-swap",
      });

      expect(allowed).toBe(false);
      expect(consume).toHaveBeenCalledWith("t-swap:203.0.113.1", {
        maxTokens: 5,
        refillRate: 1,
      });
    } finally {
      setRateLimitStore(previous);
    }
  });

  it("hands back the store it replaced, so a caller can restore it", () => {
    const replacement = createMemoryStore();
    const previous = setRateLimitStore(replacement);
    const restored = setRateLimitStore(previous);

    expect(restored).toBe(replacement);
  });
});

describe("resolveClientIp", () => {
  it("trusts the platform's own header over anything the caller sent", () => {
    const ip = resolveClientIp(
      headerReader({
        "x-vercel-forwarded-for": "203.0.113.7",
        "x-forwarded-for": "1.1.1.1, 203.0.113.7",
      })
    );

    expect(ip).toBe("203.0.113.7");
  });

  it("ignores a spoofed x-forwarded-for prefix", () => {
    // The caller prepends an address of their choosing; the right-most entry is
    // the one our own edge observed.
    const ip = resolveClientIp(
      headerReader({ "x-forwarded-for": "9.9.9.9, 203.0.113.7" })
    );

    expect(ip).toBe("203.0.113.7");
  });

  it("gives a spoofing caller the same bucket every time", () => {
    const first = resolveClientIp(
      headerReader({ "x-forwarded-for": "1.1.1.1, 203.0.113.7" })
    );
    const second = resolveClientIp(
      headerReader({ "x-forwarded-for": "2.2.2.2, 203.0.113.7" })
    );

    expect(first).toBe(second);
  });

  it("steps left one entry per configured proxy hop", () => {
    const chain = { "x-forwarded-for": "9.9.9.9, 203.0.113.7, 10.0.0.1" };

    expect(resolveClientIp(headerReader(chain), { trustedHops: 1 })).toBe(
      "203.0.113.7"
    );
  });

  it("reads the hop count from the environment", () => {
    vi.stubEnv("TRUSTED_PROXY_HOPS", "1");

    expect(
      resolveClientIp(headerReader({ "x-forwarded-for": "9.9.9.9, 203.0.113.7, 10.0.0.1" }))
    ).toBe("203.0.113.7");
  });

  it("falls back to the right-most entry when the chain is shorter than configured", () => {
    expect(
      resolveClientIp(headerReader({ "x-forwarded-for": "203.0.113.7" }), {
        trustedHops: 3,
      })
    ).toBe("203.0.113.7");
  });

  it("reads Cloudflare and Fly headers", () => {
    expect(resolveClientIp(headerReader({ "cf-connecting-ip": "203.0.113.8" }))).toBe(
      "203.0.113.8"
    );
    expect(resolveClientIp(headerReader({ "fly-client-ip": "203.0.113.9" }))).toBe(
      "203.0.113.9"
    );
  });

  it("falls back to a single shared bucket rather than no limit at all", () => {
    expect(resolveClientIp(headerReader({}))).toBe("unknown");
  });
});

describe("getClientIp", () => {
  it("resolves the address from the request headers", async () => {
    vi.mocked(headers).mockResolvedValueOnce(
      new Headers({ "x-forwarded-for": "198.51.100.9, 10.0.0.1" })
    );

    expect(await getClientIp()).toBe("10.0.0.1");
  });

  it("falls back to x-real-ip, then to a shared bucket", async () => {
    vi.mocked(headers).mockResolvedValueOnce(
      new Headers({ "x-real-ip": "198.51.100.10" })
    );
    expect(await getClientIp()).toBe("198.51.100.10");

    vi.mocked(headers).mockResolvedValueOnce(new Headers());
    expect(await getClientIp()).toBe("unknown");
  });
});
