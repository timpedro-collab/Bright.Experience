/**
 * Tests for telemetry ingest + lead capture schemas. These are the
 * only inputs that come from on-site hardware, so input validation
 * has real defensive value.
 */

import { describe, it, expect } from "vitest";
import { ingestTelemetrySchema, captureLeadSchema } from "./telemetry";

describe("ingestTelemetrySchema", () => {
  const valid = {
    machineSerial: "BB-001",
    eventId: "00000000-0000-4000-8000-000000000001",
    eventType: "play_started" as const,
  };

  it("accepts the minimal valid event", () => {
    expect(() => ingestTelemetrySchema.parse(valid)).not.toThrow();
  });

  it("rejects an empty machineSerial", () => {
    expect(() =>
      ingestTelemetrySchema.parse({ ...valid, machineSerial: "" })
    ).toThrow(/Machine serial/);
  });

  it("rejects an invalid eventId UUID", () => {
    expect(() =>
      ingestTelemetrySchema.parse({ ...valid, eventId: "garbage" })
    ).toThrow(/Valid event ID/);
  });

  it.each([
    "play_started",
    "play_completed",
    "lead_captured",
    "prize_awarded",
    "heartbeat",
    "error",
  ] as const)("accepts event type %s", (eventType) => {
    expect(() =>
      ingestTelemetrySchema.parse({ ...valid, eventType })
    ).not.toThrow();
  });

  it("rejects an unknown event type", () => {
    expect(() =>
      ingestTelemetrySchema.parse({ ...valid, eventType: "nope" })
    ).toThrow();
  });

  it("accepts an optional payload object", () => {
    expect(() =>
      ingestTelemetrySchema.parse({
        ...valid,
        payload: { duration: 30, score: 1000 },
      })
    ).not.toThrow();
  });
});

describe("captureLeadSchema", () => {
  const valid = {
    eventId: "00000000-0000-4000-8000-000000000001",
    contactName: "Casey",
    contactEmail: "casey@example.com",
  };

  it("accepts the minimal valid lead", () => {
    expect(() => captureLeadSchema.parse(valid)).not.toThrow();
  });

  it("rejects empty contactName", () => {
    expect(() =>
      captureLeadSchema.parse({ ...valid, contactName: "" })
    ).toThrow(/Contact name/);
  });

  it("rejects an invalid email", () => {
    expect(() =>
      captureLeadSchema.parse({ ...valid, contactEmail: "garbage" })
    ).toThrow(/Valid email/);
  });

  it("accepts custom fields", () => {
    expect(() =>
      captureLeadSchema.parse({
        ...valid,
        customFields: { source: "QR", colour: "blue" },
      })
    ).not.toThrow();
  });
});
