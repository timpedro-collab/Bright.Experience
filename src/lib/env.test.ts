/**
 * Tests for env validation. The contract is asymmetric on purpose:
 * development warns and keeps going, production refuses to boot.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

import { checkRequiredEnv } from "./env";

const ALL_REQUIRED = {
  NEXT_PUBLIC_SUPABASE_URL: "https://project.supabase.co",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon",
  NEXT_PUBLIC_SITE_URL: "https://app.brightblue.co.uk",
  SUPABASE_SERVICE_ROLE_KEY: "service",
  CRON_SECRET: "cron",
  RESEND_API_KEY: "resend",
  FROM_EMAIL: "hello@brightblue.co.uk",
  NEXT_PUBLIC_CALCOM_LINK: "brightblue/15min",
  BRIGHTBLUE_WEBHOOK_SECRET: "bb-secret",
  CALCOM_WEBHOOK_SECRET: "cal-secret",
  NEXT_PUBLIC_SENTRY_DSN: "https://sentry.example/1",
  BRIGHTBLUE_API_KEY: "bb-api",
};

function setEnv(values: Record<string, string | undefined>) {
  for (const [key, value] of Object.entries(values)) {
    vi.stubEnv(key, value ?? "");
  }
}

beforeEach(() => {
  vi.spyOn(console, "warn").mockImplementation(() => {});
  vi.spyOn(console, "info").mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("checkRequiredEnv in development", () => {
  beforeEach(() => {
    setEnv({ NODE_ENV: "development", ...ALL_REQUIRED });
  });

  it("warns instead of throwing when a production-only variable is missing", () => {
    setEnv({ CRON_SECRET: undefined, RESEND_API_KEY: undefined });

    expect(() => checkRequiredEnv()).not.toThrow();
  });

  it("warns rather than throwing even when a core variable is missing", () => {
    setEnv({ NEXT_PUBLIC_SUPABASE_URL: undefined });

    expect(() => checkRequiredEnv()).not.toThrow();
    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining("NEXT_PUBLIC_SUPABASE_URL")
    );
  });
});

describe("checkRequiredEnv in production", () => {
  beforeEach(() => {
    setEnv({ NODE_ENV: "production", NEXT_PHASE: "", ...ALL_REQUIRED });
  });

  it("boots when everything required is present", () => {
    expect(() => checkRequiredEnv()).not.toThrow();
  });

  it("refuses to boot without CRON_SECRET, since every cron would 401", () => {
    setEnv({ CRON_SECRET: undefined });

    expect(() => checkRequiredEnv()).toThrow(/CRON_SECRET/);
  });

  it("refuses to boot without the webhook secrets", () => {
    setEnv({ BRIGHTBLUE_WEBHOOK_SECRET: undefined, CALCOM_WEBHOOK_SECRET: undefined });

    expect(() => checkRequiredEnv()).toThrow(/BRIGHTBLUE_WEBHOOK_SECRET/);
  });

  it("names every missing variable in one message", () => {
    setEnv({ RESEND_API_KEY: undefined, FROM_EMAIL: undefined });

    expect(() => checkRequiredEnv()).toThrow(/RESEND_API_KEY, FROM_EMAIL/);
  });

  it("only warns during the build phase, which has no runtime secrets", () => {
    setEnv({ NEXT_PHASE: "phase-production-build", CRON_SECRET: undefined });

    expect(() => checkRequiredEnv()).not.toThrow();
    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining("CRON_SECRET")
    );
  });

  it("treats a missing recommended variable as information only", () => {
    setEnv({ NEXT_PUBLIC_SENTRY_DSN: undefined });

    expect(() => checkRequiredEnv()).not.toThrow();
    expect(console.info).toHaveBeenCalledWith(
      expect.stringContaining("NEXT_PUBLIC_SENTRY_DSN")
    );
  });
});
