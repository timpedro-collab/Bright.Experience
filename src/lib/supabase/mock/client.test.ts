/**
 * Unit tests for the mock client's upsert, which has to match the Postgres
 * behaviour the webhook ingest paths rely on: NULL conflict keys stay distinct
 * and `ignoreDuplicates` leaves the stored row alone.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { createMockServiceClient } from "./client";
import { getTable } from "./store";

const TABLE = "telemetry_events";

function rows() {
  return getTable(TABLE);
}

describe("mock client upsert", () => {
  beforeEach(() => {
    rows().length = 0;
  });

  it("collapses a redelivery that carries the same conflict key", async () => {
    const db = createMockServiceClient();
    const row = {
      machine_instance_id: "inst-1",
      event_id: "ev-1",
      event_type: "play_started",
      external_event_id: "batch:abc:0",
    };

    await db.from(TABLE).upsert([row], {
      onConflict: "external_event_id",
      ignoreDuplicates: true,
    });
    await db.from(TABLE).upsert([row], {
      onConflict: "external_event_id",
      ignoreDuplicates: true,
    });

    expect(rows()).toHaveLength(1);
  });

  it("collapses null conflict keys, matching the nulls-not-distinct indexes we upsert against", async () => {
    const db = createMockServiceClient();
    const row = {
      event_type: "play_started",
      external_event_id: null,
    };

    await db.from(TABLE).upsert([row, { ...row }], {
      onConflict: "external_event_id",
      ignoreDuplicates: true,
    });

    expect(rows()).toHaveLength(1);
  });

  it("leaves the stored row untouched when ignoreDuplicates is set", async () => {
    const db = createMockServiceClient();
    await db.from(TABLE).upsert(
      [{ event_type: "play_started", external_event_id: "bb:1" }],
      { onConflict: "external_event_id", ignoreDuplicates: true }
    );
    await db.from(TABLE).upsert(
      [{ event_type: "prize_awarded", external_event_id: "bb:1" }],
      { onConflict: "external_event_id", ignoreDuplicates: true }
    );

    expect(rows()).toHaveLength(1);
    expect(rows()[0].event_type).toBe("play_started");
  });

  it("overwrites the stored row when ignoreDuplicates is not set", async () => {
    const db = createMockServiceClient();
    await db.from(TABLE).upsert(
      [{ event_type: "play_started", external_event_id: "bb:2" }],
      { onConflict: "external_event_id" }
    );
    await db.from(TABLE).upsert(
      [{ event_type: "prize_awarded", external_event_id: "bb:2" }],
      { onConflict: "external_event_id" }
    );

    expect(rows()).toHaveLength(1);
    expect(rows()[0].event_type).toBe("prize_awarded");
  });
});
