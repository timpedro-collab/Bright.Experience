import { describe, it, expect } from "vitest";
import {
  buildMachineBreakdown,
  groupBreakdownByZone,
  machinesNeedingAttention,
  machinesNeedingSetup,
  setupGapLabel,
  fleetTotals,
  OFFLINE_AFTER_MS,
  UNZONED_LABEL,
  type FleetMachineRow,
  type TelemetryRow,
} from "./fleet";

const NOW = new Date("2026-09-10T12:00:00Z").getTime();
const FRESH = new Date(NOW - 60_000).toISOString();
const STALE = new Date(NOW - OFFLINE_AFTER_MS - 1_000).toISOString();

const MACHINES: FleetMachineRow[] = [
  {
    id: "m1",
    serial_number: "BV-2001",
    zone: "Registration",
    mission: "welcome_gift",
    status: "deployed",
    last_heartbeat: FRESH,
  },
  {
    id: "m2",
    serial_number: "BV-2002",
    nickname: "Hall 3 unit",
    zone: "Hall 3",
    mission: "sponsor_activation",
    status: "deployed",
    last_heartbeat: STALE,
  },
  { id: "m3", serial_number: "BV-2003", status: "deployed", last_heartbeat: null },
];

const TELEMETRY: TelemetryRow[] = [
  { machine_instance_id: "m1", event_type: "play_started" },
  { machine_instance_id: "m1", event_type: "play_completed" },
  { machine_instance_id: "m1", event_type: "lead_captured" },
  { machine_instance_id: "m1", event_type: "prize_awarded" },
  { machine_instance_id: "m1", event_type: "capture_rejected_domain" },
  { machine_instance_id: "m2", event_type: "play_started" },
  { machine_instance_id: "m2", event_type: "capture_duplicate_blocked" },
  { machine_instance_id: "m2", event_type: "heartbeat" },
];

describe("buildMachineBreakdown", () => {
  it("counts plays, leads, prizes, and rejections per machine", () => {
    const [first] = buildMachineBreakdown(MACHINES, TELEMETRY, NOW);
    expect(first).toMatchObject({
      machine_instance_id: "m1",
      serial_number: "BV-2001",
      zone: "Registration",
      mission: "welcome_gift",
      plays: 2,
      leads: 1,
      prizes: 1,
      rejected: 1,
    });
  });

  it("counts both rejection reasons together", () => {
    const second = buildMachineBreakdown(MACHINES, TELEMETRY, NOW)[1];
    expect(second.rejected).toBe(1);
    expect(second.plays).toBe(1);
  });

  it("keeps silent machines on the board with zero counts", () => {
    const third = buildMachineBreakdown(MACHINES, TELEMETRY, NOW)[2];
    expect(third).toMatchObject({ serial_number: "BV-2003", plays: 0, leads: 0 });
  });

  it("marks a machine offline once its heartbeat goes stale", () => {
    const rows = buildMachineBreakdown(MACHINES, TELEMETRY, NOW);
    expect(rows[0].is_online).toBe(true);
    expect(rows[1].is_online).toBe(false);
    expect(rows[2].is_online).toBe(false);
  });

  it("ignores telemetry from a machine no longer on the show", () => {
    const rows = buildMachineBreakdown(
      MACHINES,
      [{ machine_instance_id: "gone", event_type: "play_started" }],
      NOW
    );
    expect(rows).toHaveLength(3);
    expect(fleetTotals(rows).plays).toBe(0);
  });

  it("ignores telemetry with no machine attached", () => {
    const rows = buildMachineBreakdown(
      MACHINES,
      [{ machine_instance_id: null, event_type: "play_started" }],
      NOW
    );
    expect(fleetTotals(rows).plays).toBe(0);
  });

  it("returns an empty breakdown for an empty fleet", () => {
    expect(buildMachineBreakdown([], TELEMETRY, NOW)).toEqual([]);
  });

  it("defaults a missing status to available", () => {
    const [row] = buildMachineBreakdown([{ id: "x", serial_number: "BV-X" }], [], NOW);
    expect(row.status).toBe("available");
    expect(row.is_online).toBe(false);
  });
});

describe("groupBreakdownByZone", () => {
  it("totals each zone and pushes unzoned machines last", () => {
    const zones = groupBreakdownByZone(buildMachineBreakdown(MACHINES, TELEMETRY, NOW));
    expect(zones.map((z) => z.zone)).toEqual(["Registration", "Hall 3", UNZONED_LABEL]);
    expect(zones[0]).toMatchObject({ plays: 2, leads: 1, prizes: 1, offline_count: 0 });
    expect(zones[1]).toMatchObject({ plays: 1, offline_count: 1 });
  });

  it("combines machines that share a zone", () => {
    const zones = groupBreakdownByZone(
      buildMachineBreakdown(
        [
          { id: "a", serial_number: "BV-A", zone: "Hall 1", last_heartbeat: FRESH },
          { id: "b", serial_number: "BV-B", zone: "Hall 1", last_heartbeat: FRESH },
        ],
        [
          { machine_instance_id: "a", event_type: "play_started" },
          { machine_instance_id: "b", event_type: "play_started" },
        ],
        NOW
      )
    );
    expect(zones).toHaveLength(1);
    expect(zones[0].plays).toBe(2);
  });

  it("returns nothing for an empty breakdown", () => {
    expect(groupBreakdownByZone([])).toEqual([]);
  });
});

describe("machinesNeedingAttention", () => {
  it("lists offline machines before an online but idle one", () => {
    const withIdle = [
      ...MACHINES,
      { id: "m4", serial_number: "BV-2004", last_heartbeat: FRESH },
    ];
    const attention = machinesNeedingAttention(
      buildMachineBreakdown(withIdle, TELEMETRY, NOW)
    );
    expect(attention.map((m) => m.serial_number)).toEqual([
      "BV-2003",
      "BV-2002",
      "BV-2004",
    ]);
  });

  it("orders equally-offline machines with the quietest first", () => {
    const attention = machinesNeedingAttention(
      buildMachineBreakdown(MACHINES, TELEMETRY, NOW)
    );
    // BV-2003 has taken nothing at all; BV-2002 managed one play before
    // dropping off, so the totally silent unit is surfaced first.
    expect(attention.map((m) => m.serial_number)).toEqual(["BV-2003", "BV-2002"]);
  });

  it("excludes a healthy machine that is taking plays", () => {
    const attention = machinesNeedingAttention(
      buildMachineBreakdown(MACHINES, TELEMETRY, NOW)
    );
    expect(attention.some((m) => m.serial_number === "BV-2001")).toBe(false);
  });

  it("flags an online machine that has taken no plays at all", () => {
    const attention = machinesNeedingAttention(
      buildMachineBreakdown(
        [{ id: "idle", serial_number: "BV-IDLE", last_heartbeat: FRESH }],
        [],
        NOW
      )
    );
    expect(attention).toHaveLength(1);
  });
});

describe("machinesNeedingSetup", () => {
  it("lists units missing a zone or a mission and leaves ready ones out", () => {
    const setup = machinesNeedingSetup(
      buildMachineBreakdown(MACHINES, TELEMETRY, NOW)
    );
    // BV-2003 has neither; BV-2001 and BV-2002 are both placed with a job.
    expect(setup.map((m) => m.serial_number)).toEqual(["BV-2003"]);
  });

  it("treats a blank zone as no zone", () => {
    const setup = machinesNeedingSetup(
      buildMachineBreakdown(
        [
          {
            id: "blank",
            serial_number: "BV-BLANK",
            zone: "   ",
            mission: "sampling",
          },
        ],
        [],
        NOW
      )
    );
    expect(setup).toHaveLength(1);
  });

  it("ignores heartbeat entirely — a warehoused unit is not a fault", () => {
    const setup = machinesNeedingSetup(
      buildMachineBreakdown(
        [
          {
            id: "packed",
            serial_number: "BV-PACKED",
            zone: "Hall 1",
            mission: "lead_capture",
            last_heartbeat: null,
          },
        ],
        [],
        NOW
      )
    );
    expect(setup).toHaveLength(0);
  });
});

describe("setupGapLabel", () => {
  it("names exactly what is missing", () => {
    const [none, noMission, noZone] = buildMachineBreakdown(
      [
        { id: "a", serial_number: "A" },
        { id: "b", serial_number: "B", zone: "Hall 1" },
        { id: "c", serial_number: "C", mission: "sampling" },
      ],
      [],
      NOW
    );
    expect(setupGapLabel(none)).toBe("needs a zone and a job");
    expect(setupGapLabel(noMission)).toBe("needs a job");
    expect(setupGapLabel(noZone)).toBe("needs a zone");
  });
});

describe("fleetTotals", () => {
  it("sums the fleet so the roll-up matches its parts", () => {
    expect(fleetTotals(buildMachineBreakdown(MACHINES, TELEMETRY, NOW))).toEqual({
      machines: 3,
      online: 1,
      plays: 3,
      leads: 1,
      prizes: 1,
      rejected: 2,
    });
  });

  it("returns zeroes for an empty fleet", () => {
    expect(fleetTotals([])).toEqual({
      machines: 0,
      online: 0,
      plays: 0,
      leads: 0,
      prizes: 0,
      rejected: 0,
    });
  });
});
