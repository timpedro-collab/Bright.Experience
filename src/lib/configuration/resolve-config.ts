/**
 * Resolve which configuration applies to a given machine.
 *
 * A show holds one configuration row per scope: `machineInstanceId === null`
 * is the show-wide default, and a row carrying a machine id overrides it for
 * that unit only. A single-machine brand activation therefore keeps exactly
 * the behaviour it always had (one default row, no overrides), while an
 * organizer show can run a welcome gift at registration and a sponsor game
 * on the floor from the same event.
 */

import type { MachineMission } from "@/types";

/** Any configuration row carrying the scope discriminator. */
export interface ScopedConfig {
  machineInstanceId: string | null;
}

/** The subset of a machine we need to present and resolve its configuration. */
export interface FleetMachine {
  id: string;
  serialNumber: string;
  nickname?: string;
  zone?: string | null;
  mission?: MachineMission | null;
}

/** A machine paired with the configuration that will actually run on it. */
export interface ResolvedMachineConfig<T extends ScopedConfig> {
  machine: FleetMachine;
  config: T | null;
  /** True when this machine has its own row rather than inheriting the default. */
  isOverride: boolean;
}

/** The show-wide default row, if one has been saved. */
export function findDefaultConfig<T extends ScopedConfig>(rows: T[]): T | null {
  return rows.find((r) => r.machineInstanceId === null) ?? null;
}

/**
 * The configuration a specific machine runs: its own row if it has one,
 * otherwise the show-wide default. Returns null when neither exists.
 */
export function resolveConfigForMachine<T extends ScopedConfig>(
  rows: T[],
  machineInstanceId: string | null
): T | null {
  if (machineInstanceId) {
    const own = rows.find((r) => r.machineInstanceId === machineInstanceId);
    if (own) return own;
  }
  return findDefaultConfig(rows);
}

/** True when `machineInstanceId` has its own configuration row. */
export function hasOverride<T extends ScopedConfig>(
  rows: T[],
  machineInstanceId: string
): boolean {
  return rows.some((r) => r.machineInstanceId === machineInstanceId);
}

/**
 * Resolve configuration across a whole fleet, preserving machine order. Used
 * by the configuration UI (to show which units diverge from the default) and
 * by the config payload builder (to ship one resolved block per machine).
 */
export function resolveFleetConfig<T extends ScopedConfig>(
  machines: FleetMachine[],
  rows: T[]
): ResolvedMachineConfig<T>[] {
  return machines.map((machine) => ({
    machine,
    config: resolveConfigForMachine(rows, machine.id),
    isOverride: hasOverride(rows, machine.id),
  }));
}

/**
 * Group machines by zone for display. Machines with no zone collect under
 * `Unassigned` so nothing is silently dropped from a fleet view.
 */
export function groupMachinesByZone(
  machines: FleetMachine[],
  unassignedLabel = "Unassigned"
): { zone: string; machines: FleetMachine[] }[] {
  const groups = new Map<string, FleetMachine[]>();
  for (const machine of machines) {
    const zone = machine.zone?.trim() || unassignedLabel;
    const bucket = groups.get(zone);
    if (bucket) bucket.push(machine);
    else groups.set(zone, [machine]);
  }
  // Zones in first-seen order, with the catch-all bucket last.
  return [...groups.entries()]
    .map(([zone, list]) => ({ zone, machines: list }))
    .sort((a, b) => {
      if (a.zone === unassignedLabel) return 1;
      if (b.zone === unassignedLabel) return -1;
      return 0;
    });
}
