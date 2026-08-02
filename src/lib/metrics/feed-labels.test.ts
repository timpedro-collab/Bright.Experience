import { describe, it, expect } from "vitest";

import {
  TELEMETRY_FEED_LABELS,
  feedType,
  feedItemFromTelemetry,
} from "./feed-labels";

describe("feedType", () => {
  it("buckets lead, play and prize events for icon styling", () => {
    expect(feedType("lead_captured")).toBe("lead");
    expect(feedType("play_started")).toBe("play");
    expect(feedType("play_completed")).toBe("play");
    expect(feedType("prize_awarded")).toBe("prize");
  });

  it("falls back to the first segment for anything else", () => {
    expect(feedType("capture_rejected_domain")).toBe("capture");
    expect(feedType("heartbeat")).toBe("heartbeat");
  });
});

describe("feedItemFromTelemetry", () => {
  it("reads a known event type as a human sentence", () => {
    const item = feedItemFromTelemetry({
      id: "t1",
      event_type: "lead_captured",
      timestamp: "2026-07-27T09:00:00Z",
      machine_instance_id: "m1",
    });

    expect(item).toEqual({
      id: "t1",
      type: "lead",
      message: "New lead captured",
      timestamp: "2026-07-27T09:00:00Z",
      machineInstanceId: "m1",
    });
  });

  it("shows the raw type rather than nothing for an unmapped event", () => {
    const item = feedItemFromTelemetry({
      id: "t2",
      event_type: "door_opened",
      timestamp: "2026-07-27T09:00:00Z",
    });

    expect(item.message).toBe("door_opened");
    expect(item.machineInstanceId).toBeNull();
  });

  it("survives a row with nothing on it", () => {
    const item = feedItemFromTelemetry({});
    expect(item.message).toBe("unknown");
    expect(item.timestamp).toBe("");
  });

  it("labels every capture-quality rejection, since those drive the quality card", () => {
    expect(TELEMETRY_FEED_LABELS.capture_rejected_domain).toBe(
      "Personal email rejected"
    );
    expect(TELEMETRY_FEED_LABELS.capture_duplicate_blocked).toBe(
      "Duplicate entry blocked"
    );
  });
});
