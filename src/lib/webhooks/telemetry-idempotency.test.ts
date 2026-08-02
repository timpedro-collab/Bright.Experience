/**
 * Tests for the telemetry idempotency keys.
 *
 * The property that matters: a redelivery of the same batch produces the same
 * keys, and two genuinely different events in one batch never share one.
 */
import { describe, it, expect } from "vitest";

import { batchDigest, telemetryExternalId } from "./telemetry-idempotency";

const BATCH = JSON.stringify({
  event_type: "telemetry.batch",
  machine_serial: "BB-001",
  event_id: "e1",
  events: [
    { type: "play_started", timestamp: "2026-07-24T12:00:00Z" },
    { type: "play_started", timestamp: "2026-07-24T12:00:00Z" },
  ],
});

describe("batchDigest", () => {
  it("is stable for identical bytes", () => {
    expect(batchDigest(BATCH)).toBe(batchDigest(BATCH));
  });

  it("changes when the payload changes", () => {
    expect(batchDigest(BATCH)).not.toBe(batchDigest(`${BATCH} `));
  });

  it("is short enough to store and index comfortably", () => {
    expect(batchDigest(BATCH)).toHaveLength(32);
  });
});

describe("telemetryExternalId", () => {
  it("uses the sender's id when it supplies one", () => {
    expect(telemetryExternalId({ id: "cloud-evt-9" }, "digest", 0)).toBe(
      "bb:cloud-evt-9"
    );
  });

  it("accepts the event_id spelling too", () => {
    expect(telemetryExternalId({ event_id: "cloud-evt-9" }, "digest", 3)).toBe(
      "bb:cloud-evt-9"
    );
  });

  it("ignores the item's position once the sender has given an id", () => {
    const first = telemetryExternalId({ id: "cloud-evt-9" }, "digest-a", 0);
    const later = telemetryExternalId({ id: "cloud-evt-9" }, "digest-b", 7);

    expect(first).toBe(later);
  });

  it("derives a key from the batch and position when there's no id", () => {
    expect(telemetryExternalId({ type: "play_started" }, "abc123", 2)).toBe(
      "batch:abc123:2"
    );
  });

  it("keeps two identical events in one batch distinct", () => {
    const digest = batchDigest(BATCH);
    const item = { type: "play_started", timestamp: "2026-07-24T12:00:00Z" };

    expect(telemetryExternalId(item, digest, 0)).not.toBe(
      telemetryExternalId(item, digest, 1)
    );
  });

  it("reproduces the same derived keys on a redelivery", () => {
    const first = batchDigest(BATCH);
    const second = batchDigest(BATCH);
    const item = { type: "play_started" };

    expect(telemetryExternalId(item, first, 1)).toBe(
      telemetryExternalId(item, second, 1)
    );
  });

  it("never lets a sender id collide with a derived key", () => {
    // A sender that names its events "abc123:2" still can't shadow the derived
    // key for position 2 of batch abc123.
    expect(telemetryExternalId({ id: "abc123:2" }, "abc123", 2)).not.toBe(
      telemetryExternalId({}, "abc123", 2)
    );
  });

  it("treats a blank sender id as absent", () => {
    expect(telemetryExternalId({ id: "   " }, "abc123", 0)).toBe("batch:abc123:0");
  });
});
