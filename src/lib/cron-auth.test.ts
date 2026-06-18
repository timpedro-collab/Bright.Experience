import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { requireCron } from "./cron-auth";

function req(headers: Record<string, string> = {}): Request {
  return new Request("https://example.com/api/cron/digest", { headers });
}

describe("requireCron", () => {
  const original = process.env.CRON_SECRET;

  beforeEach(() => {
    process.env.CRON_SECRET = "test-secret";
  });
  afterEach(() => {
    if (original === undefined) delete process.env.CRON_SECRET;
    else process.env.CRON_SECRET = original;
  });

  it("accepts a matching bearer token", () => {
    expect(requireCron(req({ authorization: "Bearer test-secret" }))).toBe(true);
  });

  it("rejects a missing authorization header", () => {
    expect(requireCron(req())).toBe(false);
  });

  it("rejects a wrong bearer token", () => {
    expect(requireCron(req({ authorization: "Bearer nope" }))).toBe(false);
  });

  it("does NOT accept the spoofable x-vercel-cron header alone", () => {
    expect(requireCron(req({ "x-vercel-cron": "1" }))).toBe(false);
  });

  it("rejects everything when CRON_SECRET is unset", () => {
    delete process.env.CRON_SECRET;
    expect(requireCron(req({ authorization: "Bearer test-secret" }))).toBe(false);
  });
});
