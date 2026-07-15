/**
 * Tests for the in-memory token-bucket rate limiter that guards the public
 * server-action entry points (auth, quote intake, partner apply, proposal
 * decisions).
 */

import { describe, it, expect, vi } from "vitest";
import { headers } from "next/headers";
import { checkRateLimit, createRateLimiter, getClientIp } from "./rate-limit";

describe("checkRateLimit", () => {
  it("allows up to maxTokens requests then blocks", () => {
    const opts = { maxTokens: 3, refillRate: 0, prefix: "t-basic" };
    expect(checkRateLimit("a", opts)).toBe(true);
    expect(checkRateLimit("a", opts)).toBe(true);
    expect(checkRateLimit("a", opts)).toBe(true);
    expect(checkRateLimit("a", opts)).toBe(false);
  });

  it("keeps buckets separate per identifier and per prefix", () => {
    const opts = { maxTokens: 1, refillRate: 0, prefix: "t-scope" };
    expect(checkRateLimit("ip-1", opts)).toBe(true);
    expect(checkRateLimit("ip-1", opts)).toBe(false);
    // Different identifier: fresh bucket.
    expect(checkRateLimit("ip-2", opts)).toBe(true);
    // Same identifier, different prefix: fresh bucket.
    expect(checkRateLimit("ip-1", { ...opts, prefix: "t-scope-other" })).toBe(true);
  });

  it("refills tokens over time", () => {
    vi.useFakeTimers();
    try {
      const opts = { maxTokens: 1, refillRate: 1, prefix: "t-refill" };
      expect(checkRateLimit("a", opts)).toBe(true);
      expect(checkRateLimit("a", opts)).toBe(false);
      vi.advanceTimersByTime(1100);
      expect(checkRateLimit("a", opts)).toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });

  it("createRateLimiter presets the options", () => {
    const limiter = createRateLimiter({
      maxTokens: 2,
      refillRate: 0,
      prefix: "t-preset",
    });
    expect(limiter("x")).toBe(true);
    expect(limiter("x")).toBe(true);
    expect(limiter("x")).toBe(false);
  });
});

describe("getClientIp", () => {
  it("reads the first x-forwarded-for hop", async () => {
    vi.mocked(headers).mockResolvedValueOnce(
      new Headers({ "x-forwarded-for": "198.51.100.9, 10.0.0.1" })
    );
    expect(await getClientIp()).toBe("198.51.100.9");
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
