/** Tests for per-sponsor proof-of-performance aggregation. */
import { describe, it, expect } from "vitest";
import {
  buildSponsorProof,
  type SponsorSlotRow,
  type SponsorTelemetryRow,
} from "./sponsor-proof";

const SLOT: SponsorSlotRow = {
  id: "slot-1",
  sponsor_name: "Sponsor Co",
  machine_instance_id: "m1",
  start_date: "2026-09-15",
  end_date: "2026-09-16",
  status: "active",
  machine_instances: { serial_number: "BV-2001", nickname: null, zone: "Hall 3" },
};

function telemetry(
  rows: Array<[string, string, string | null]>
): SponsorTelemetryRow[] {
  return rows.map(([event_type, timestamp, machine_instance_id]) => ({
    event_type,
    timestamp,
    machine_instance_id,
  }));
}

describe("buildSponsorProof", () => {
  it("counts only the sponsor's own machine", () => {
    const [proof] = buildSponsorProof(
      [SLOT],
      telemetry([
        ["play_started", "2026-09-15T10:00:00Z", "m1"],
        ["play_started", "2026-09-15T11:00:00Z", "m2"],
        ["lead_captured", "2026-09-15T10:01:00Z", "m1"],
      ])
    );
    expect(proof.plays).toBe(1);
    expect(proof.leads).toBe(1);
  });

  it("counts only telemetry inside the slot's dates", () => {
    const [proof] = buildSponsorProof(
      [SLOT],
      telemetry([
        ["play_started", "2026-09-14T23:59:00Z", "m1"],
        ["play_started", "2026-09-15T00:00:00Z", "m1"],
        ["play_started", "2026-09-16T23:59:00Z", "m1"],
        ["play_started", "2026-09-17T00:01:00Z", "m1"],
      ])
    );
    expect(proof.plays).toBe(2);
  });

  it("derives the opt-in rate from plays", () => {
    const [proof] = buildSponsorProof(
      [SLOT],
      telemetry([
        ["play_started", "2026-09-15T10:00:00Z", "m1"],
        ["play_started", "2026-09-15T10:05:00Z", "m1"],
        ["play_started", "2026-09-15T10:10:00Z", "m1"],
        ["play_started", "2026-09-15T10:15:00Z", "m1"],
        ["lead_captured", "2026-09-15T10:16:00Z", "m1"],
        ["prize_awarded", "2026-09-15T10:17:00Z", "m1"],
      ])
    );
    expect(proof).toMatchObject({ plays: 4, leads: 1, prizes: 1, optInRate: 25 });
  });

  it("labels the slot with its zone and machine", () => {
    const [proof] = buildSponsorProof([SLOT], []);
    expect(proof.zone).toBe("Hall 3");
    expect(proof.machineLabel).toBe("BV-2001");
  });

  it("prefers a machine nickname over its serial", () => {
    const [proof] = buildSponsorProof(
      [
        {
          ...SLOT,
          machine_instances: [
            { serial_number: "BV-2001", nickname: "Front desk", zone: "Hall 3" },
          ],
        },
      ],
      []
    );
    expect(proof.machineLabel).toBe("Front desk");
  });

  it("skips unsold slots so the report doesn't advertise what didn't sell", () => {
    const proof = buildSponsorProof(
      [{ ...SLOT, status: "available", sponsor_name: null }],
      []
    );
    expect(proof).toEqual([]);
  });

  it("skips slots with no machine assigned", () => {
    expect(buildSponsorProof([{ ...SLOT, machine_instance_id: null }], [])).toEqual([]);
  });

  it("names a sold slot that never got a sponsor name", () => {
    const [proof] = buildSponsorProof([{ ...SLOT, sponsor_name: "  " }], []);
    expect(proof.sponsorName).toBe("Unnamed sponsor");
  });

  it("orders sponsors by plays delivered", () => {
    const proof = buildSponsorProof(
      [
        SLOT,
        { ...SLOT, id: "slot-2", sponsor_name: "Quiet Co", machine_instance_id: "m2" },
      ],
      telemetry([
        ["play_started", "2026-09-15T10:00:00Z", "m1"],
        ["play_started", "2026-09-15T10:05:00Z", "m1"],
        ["play_started", "2026-09-15T10:10:00Z", "m2"],
      ])
    );
    expect(proof.map((p) => p.sponsorName)).toEqual(["Sponsor Co", "Quiet Co"]);
  });

  it("returns nothing for a show with no sponsors", () => {
    expect(buildSponsorProof([], telemetry([["play_started", "2026-09-15T10:00:00Z", "m1"]])))
      .toEqual([]);
  });
});
