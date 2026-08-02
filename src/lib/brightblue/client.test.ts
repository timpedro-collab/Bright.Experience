/** Tests for the outbound Cloud client — config push behaviour. */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { pushEventConfig } from "./client";
import { buildEventConfigPayload } from "./config-payload";
import { defaultCaptureRules } from "@/lib/capture-rules";

const PAYLOAD = buildEventConfigPayload("e1", {
  prizeMode: "random",
  prizesJson: [],
  formFieldsJson: [],
  leaderboardEnabled: false,
  gameParametersJson: {},
  idleScreenConfigJson: {},
  captureRulesJson: defaultCaptureRules(),
  retentionDays: 60,
  brandedLanding: false,
});

const originalUrl = process.env.BRIGHTBLUE_API_URL;
const originalKey = process.env.BRIGHTBLUE_API_KEY;

afterEach(() => {
  if (originalUrl !== undefined) process.env.BRIGHTBLUE_API_URL = originalUrl;
  else delete process.env.BRIGHTBLUE_API_URL;
  if (originalKey !== undefined) process.env.BRIGHTBLUE_API_KEY = originalKey;
  else delete process.env.BRIGHTBLUE_API_KEY;
  vi.unstubAllGlobals();
});

describe("pushEventConfig", () => {
  beforeEach(() => {
    delete process.env.BRIGHTBLUE_API_URL;
    delete process.env.BRIGHTBLUE_API_KEY;
  });

  it("returns false (and never fetches) when Cloud is not configured", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);

    const ok = await pushEventConfig(PAYLOAD);
    expect(ok).toBe(false);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("PUTs the payload to the event config endpoint when configured", async () => {
    process.env.BRIGHTBLUE_API_URL = "https://cloud.test/api/v1";
    process.env.BRIGHTBLUE_API_KEY = "test-key";
    const fetchSpy = vi.fn(async () => ({
      ok: true,
      json: async () => ({ received: true }),
    }));
    vi.stubGlobal("fetch", fetchSpy);

    const ok = await pushEventConfig(PAYLOAD);
    expect(ok).toBe(true);

    const [url, opts] = fetchSpy.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://cloud.test/api/v1/events/e1/config");
    expect(opts.method).toBe("PUT");
    const body = JSON.parse(String(opts.body));
    expect(body.capture_rules.business_emails_only).toBe(true);
    expect(
      (opts.headers as Record<string, string>).Authorization
    ).toBe("Bearer test-key");
  });

  it("returns false when Cloud rejects the push", async () => {
    process.env.BRIGHTBLUE_API_URL = "https://cloud.test/api/v1";
    process.env.BRIGHTBLUE_API_KEY = "test-key";
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: false,
        status: 500,
        text: async () => "boom",
      }))
    );

    const ok = await pushEventConfig(PAYLOAD);
    expect(ok).toBe(false);
  });
});
