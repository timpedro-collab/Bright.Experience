/** Tests for Bright.Blue Cloud webhook HMAC verification. */

import { describe, it, expect, afterEach } from "vitest";
import { computeSignature, verifySignature, getWebhookSecret } from "./verify";

const TEST_SECRET = "test-webhook-secret-32chars-long!";

describe("computeSignature", () => {
  it("produces a deterministic hex digest", () => {
    const sig = computeSignature('{"foo":"bar"}', TEST_SECRET);
    expect(sig).toMatch(/^[a-f0-9]{64}$/);
    expect(computeSignature('{"foo":"bar"}', TEST_SECRET)).toBe(sig);
  });

  it("varies with different payloads", () => {
    const a = computeSignature("a", TEST_SECRET);
    const b = computeSignature("b", TEST_SECRET);
    expect(a).not.toBe(b);
  });
});

describe("verifySignature", () => {
  const body = '{"event_type":"telemetry.batch"}';
  const validSig = computeSignature(body, TEST_SECRET);

  it("returns true for a valid signature", () => {
    expect(verifySignature(body, validSig, TEST_SECRET)).toBe(true);
  });

  it("returns false for a tampered signature", () => {
    const tampered = validSig.replace(/^./, "0");
    expect(verifySignature(body, tampered, TEST_SECRET)).toBe(false);
  });

  it("returns false for null signature", () => {
    expect(verifySignature(body, null, TEST_SECRET)).toBe(false);
  });

  it("returns false for empty string signature", () => {
    expect(verifySignature(body, "", TEST_SECRET)).toBe(false);
  });
});

describe("getWebhookSecret", () => {
  const original = process.env.BRIGHTBLUE_WEBHOOK_SECRET;

  afterEach(() => {
    if (original !== undefined) {
      process.env.BRIGHTBLUE_WEBHOOK_SECRET = original;
    } else {
      delete process.env.BRIGHTBLUE_WEBHOOK_SECRET;
    }
  });

  it("returns the secret when set", () => {
    process.env.BRIGHTBLUE_WEBHOOK_SECRET = "my-secret";
    expect(getWebhookSecret()).toBe("my-secret");
  });

  it("throws when not set", () => {
    delete process.env.BRIGHTBLUE_WEBHOOK_SECRET;
    expect(() => getWebhookSecret()).toThrow("BRIGHTBLUE_WEBHOOK_SECRET");
  });
});
