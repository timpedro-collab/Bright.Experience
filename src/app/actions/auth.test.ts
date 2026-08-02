/**
 * Tests for the auth server actions — the security contract is that login and
 * password reset are rate-limited at the server boundary, and Supabase errors
 * surface as a clean failure result.
 */
import { describe, it, expect, beforeEach, vi } from "vitest";

const signInMock = vi.fn();
const resetMock = vi.fn();

vi.mock("next/headers", () => ({
  headers: async () => ({
    get: (k: string) => {
      if (k === "x-forwarded-for") return "1.2.3.4";
      // An attacker-controlled origin: the reset link must not be built from it.
      if (k === "origin") return "https://evil.example";
      return null;
    },
  }),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: {
      signInWithPassword: (...args: unknown[]) => signInMock(...args),
      resetPasswordForEmail: (...args: unknown[]) => resetMock(...args),
    },
  })),
}));

beforeEach(() => {
  signInMock.mockReset().mockResolvedValue({ error: null });
  resetMock.mockReset().mockResolvedValue({ error: null });
});

describe("signInWithPassword", () => {
  it("returns success when Supabase accepts the credentials", async () => {
    const { signInWithPassword } = await import("./auth");
    const result = await signInWithPassword("ok-user@example.com", "pw");
    expect(result).toEqual({ success: true });
  });

  it("surfaces a Supabase error as a clean failure", async () => {
    signInMock.mockResolvedValue({ error: { message: "Invalid login credentials" } });
    const { signInWithPassword } = await import("./auth");
    const result = await signInWithPassword("bad-creds@example.com", "pw");
    expect(result).toEqual({ success: false, error: "Invalid login credentials" });
  });

  it("rate-limits after the bucket is exhausted (5 allowed, 6th blocked)", async () => {
    const { signInWithPassword } = await import("./auth");
    const email = "brute-force@example.com";
    const results = [];
    for (let i = 0; i < 6; i++) {
      results.push(await signInWithPassword(email, "pw"));
    }
    expect(results.slice(0, 5).every((r) => r.success)).toBe(true);
    expect(results[5].success).toBe(false);
  });
});

describe("requestPasswordReset", () => {
  it("builds the reset link from the configured site URL, not the request", async () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://app.brightblue.co.uk");
    const { requestPasswordReset } = await import("./auth");

    const result = await requestPasswordReset("reset-user@example.com");

    expect(result).toEqual({ success: true });
    expect(resetMock).toHaveBeenCalledWith("reset-user@example.com", {
      redirectTo: "https://app.brightblue.co.uk/auth/reset-password",
    });
    vi.unstubAllEnvs();
  });

  it("falls back to the request origin only when no site URL is configured", async () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "");
    const { requestPasswordReset } = await import("./auth");

    await requestPasswordReset("dev-user@example.com");

    expect(resetMock).toHaveBeenCalledWith("dev-user@example.com", {
      redirectTo: "https://evil.example/auth/reset-password",
    });
    vi.unstubAllEnvs();
  });
});
