import { describe, it, expect } from "vitest";
import {
  findDefaultConfig,
  resolveConfigForMachine,
  hasOverride,
  resolveFleetConfig,
  groupMachinesByZone,
  type FleetMachine,
} from "./resolve-config";

interface TestConfig {
  machineInstanceId: string | null;
  label: string;
}

const showDefault: TestConfig = { machineInstanceId: null, label: "show default" };
const registrationOverride: TestConfig = { machineInstanceId: "m1", label: "welcome gift" };

const machines: FleetMachine[] = [
  { id: "m1", serialNumber: "BV-1", zone: "Registration", mission: "welcome_gift" },
  { id: "m2", serialNumber: "BV-2", zone: "Hall 3", mission: "sponsor_activation" },
  { id: "m3", serialNumber: "BV-3" },
];

describe("findDefaultConfig", () => {
  it("returns the row with no machine scope", () => {
    expect(findDefaultConfig([registrationOverride, showDefault])).toBe(showDefault);
  });

  it("returns null when only machine-scoped rows exist", () => {
    expect(findDefaultConfig([registrationOverride])).toBeNull();
  });
});

describe("resolveConfigForMachine", () => {
  it("prefers a machine's own configuration over the show default", () => {
    expect(resolveConfigForMachine([showDefault, registrationOverride], "m1")).toBe(
      registrationOverride
    );
  });

  it("falls back to the show default for machines without an override", () => {
    expect(resolveConfigForMachine([showDefault, registrationOverride], "m2")).toBe(
      showDefault
    );
  });

  it("returns the show default when asked for the default scope", () => {
    expect(resolveConfigForMachine([showDefault, registrationOverride], null)).toBe(
      showDefault
    );
  });

  it("returns null when a show has no configuration at all", () => {
    expect(resolveConfigForMachine([], "m1")).toBeNull();
  });

  it("returns null when a machine has no override and there is no default", () => {
    expect(resolveConfigForMachine([registrationOverride], "m2")).toBeNull();
  });
});

describe("hasOverride", () => {
  it("distinguishes an overridden machine from an inheriting one", () => {
    const rows = [showDefault, registrationOverride];
    expect(hasOverride(rows, "m1")).toBe(true);
    expect(hasOverride(rows, "m2")).toBe(false);
  });
});

describe("resolveFleetConfig", () => {
  it("resolves every machine and flags which ones diverge", () => {
    const resolved = resolveFleetConfig(machines, [showDefault, registrationOverride]);
    expect(resolved.map((r) => r.machine.serialNumber)).toEqual(["BV-1", "BV-2", "BV-3"]);
    expect(resolved[0].config?.label).toBe("welcome gift");
    expect(resolved[0].isOverride).toBe(true);
    expect(resolved[1].config?.label).toBe("show default");
    expect(resolved[1].isOverride).toBe(false);
    expect(resolved[2].config?.label).toBe("show default");
  });

  it("yields null configs when nothing has been saved yet", () => {
    const resolved = resolveFleetConfig(machines, []);
    expect(resolved.every((r) => r.config === null)).toBe(true);
    expect(resolved.every((r) => r.isOverride === false)).toBe(true);
  });

  it("returns an empty list for an empty fleet", () => {
    expect(resolveFleetConfig([], [showDefault])).toEqual([]);
  });
});

describe("groupMachinesByZone", () => {
  it("groups by zone and keeps unzoned machines in a trailing bucket", () => {
    const groups = groupMachinesByZone(machines);
    expect(groups.map((g) => g.zone)).toEqual(["Registration", "Hall 3", "Unassigned"]);
    expect(groups[2].machines.map((m) => m.serialNumber)).toEqual(["BV-3"]);
  });

  it("treats whitespace-only zones as unassigned", () => {
    const groups = groupMachinesByZone([{ id: "m4", serialNumber: "BV-4", zone: "   " }]);
    expect(groups).toEqual([
      { zone: "Unassigned", machines: [{ id: "m4", serialNumber: "BV-4", zone: "   " }] },
    ]);
  });

  it("collects multiple machines sharing a zone", () => {
    const groups = groupMachinesByZone([
      { id: "a", serialNumber: "BV-A", zone: "Registration" },
      { id: "b", serialNumber: "BV-B", zone: "Registration" },
    ]);
    expect(groups).toHaveLength(1);
    expect(groups[0].machines).toHaveLength(2);
  });

  it("returns an empty list for an empty fleet", () => {
    expect(groupMachinesByZone([])).toEqual([]);
  });
});
