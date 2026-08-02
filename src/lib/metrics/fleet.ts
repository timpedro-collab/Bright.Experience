/**
 * Per-machine metrics roll-up.
 *
 * The live dashboard was built for a single-machine activation, so every
 * metric collapsed to an event total. A show running a fleet needs the same
 * numbers split by unit and grouped by zone: an organizer's first question is
 * never "how many plays" but "which machine is dead and which zone is hot".
 *
 * Telemetry and lead rows already carry `machine_instance_id`, so this is a
 * grouping problem rather than a new data source. Pure functions — the route
 * fetches, these shape.
 */

import type { MachineMission } from "@/types";

/** Minimum a telemetry row needs to be counted. */
export interface TelemetryRow {
  machine_instance_id?: string | null;
  event_type?: string | null;
  timestamp?: string | null;
}

/** A deployed unit as the live route reads it. */
export interface FleetMachineRow {
  id: string;
  serial_number: string;
  nickname?: string | null;
  zone?: string | null;
  mission?: MachineMission | null;
  status?: string | null;
  last_heartbeat?: string | null;
}

/** Per-machine counters plus the health signals an operator acts on. */
export interface MachineBreakdown {
  machine_instance_id: string;
  serial_number: string;
  nickname: string | null;
  zone: string | null;
  mission: MachineMission | null;
  status: string;
  last_heartbeat: string | null;
  /** True when the unit has checked in within {@link OFFLINE_AFTER_MS}. */
  is_online: boolean;
  plays: number;
  leads: number;
  prizes: number;
  /** Captures the machine turned away (personal domain or duplicate). */
  rejected: number;
}

/** One zone's worth of machines and their combined totals. */
export interface ZoneBreakdown {
  zone: string;
  machines: MachineBreakdown[];
  plays: number;
  leads: number;
  prizes: number;
  offline_count: number;
}

/** A machine that misses two consecutive 5-minute heartbeats reads as offline. */
export const OFFLINE_AFTER_MS = 5 * 60 * 1000;

/** Zone label used for machines with no zone assigned. */
export const UNZONED_LABEL = "Unassigned";

function isPlay(eventType: string): boolean {
  return eventType === "play_started" || eventType === "play_completed";
}

function isLead(eventType: string): boolean {
  return eventType === "lead_captured" || eventType === "lead";
}

function isRejection(eventType: string): boolean {
  return (
    eventType === "capture_rejected_domain" ||
    eventType === "capture_duplicate_blocked"
  );
}

/**
 * Split telemetry across the fleet. Machines with no telemetry still appear
 * with zero counts — a silent machine is the most important row on the board,
 * so it must never be dropped for lack of data.
 */
export function buildMachineBreakdown(
  machines: FleetMachineRow[],
  telemetry: TelemetryRow[],
  now: number = Date.now()
): MachineBreakdown[] {
  const counters = new Map<
    string,
    { plays: number; leads: number; prizes: number; rejected: number }
  >();
  for (const machine of machines) {
    counters.set(machine.id, { plays: 0, leads: 0, prizes: 0, rejected: 0 });
  }

  for (const row of telemetry) {
    const id = row.machine_instance_id;
    if (!id) continue;
    const counter = counters.get(id);
    // Telemetry from a machine no longer assigned to this show is ignored
    // rather than inventing a row for a unit the organizer can't see.
    if (!counter) continue;
    const type = String(row.event_type ?? "");
    if (isPlay(type)) counter.plays++;
    else if (isLead(type)) counter.leads++;
    else if (type === "prize_awarded") counter.prizes++;
    else if (isRejection(type)) counter.rejected++;
  }

  return machines.map((machine) => {
    const counter = counters.get(machine.id)!;
    const heartbeat = machine.last_heartbeat ?? null;
    return {
      machine_instance_id: machine.id,
      serial_number: machine.serial_number,
      nickname: machine.nickname ?? null,
      zone: machine.zone ?? null,
      mission: machine.mission ?? null,
      status: machine.status ?? "available",
      last_heartbeat: heartbeat,
      is_online: heartbeat
        ? now - new Date(heartbeat).getTime() < OFFLINE_AFTER_MS
        : false,
      ...counter,
    };
  });
}

/**
 * Group the breakdown by zone with per-zone totals, preserving the order
 * machines arrived in and pushing unzoned units to the end.
 */
export function groupBreakdownByZone(
  breakdown: MachineBreakdown[]
): ZoneBreakdown[] {
  const zones = new Map<string, MachineBreakdown[]>();
  for (const machine of breakdown) {
    const zone = machine.zone?.trim() || UNZONED_LABEL;
    const bucket = zones.get(zone);
    if (bucket) bucket.push(machine);
    else zones.set(zone, [machine]);
  }

  return [...zones.entries()]
    .map(([zone, machines]) => ({
      zone,
      machines,
      plays: machines.reduce((sum, m) => sum + m.plays, 0),
      leads: machines.reduce((sum, m) => sum + m.leads, 0),
      prizes: machines.reduce((sum, m) => sum + m.prizes, 0),
      offline_count: machines.filter((m) => !m.is_online).length,
    }))
    .sort((a, b) => {
      if (a.zone === UNZONED_LABEL) return 1;
      if (b.zone === UNZONED_LABEL) return -1;
      return 0;
    });
}

/**
 * Units needing attention, worst first: offline machines lead, then the
 * quietest performers. Drives the "what do I fix right now" list rather than
 * making someone scan every card.
 */
export function machinesNeedingAttention(
  breakdown: MachineBreakdown[]
): MachineBreakdown[] {
  return breakdown
    .filter((m) => !m.is_online || m.plays === 0)
    .sort((a, b) => {
      if (a.is_online !== b.is_online) return a.is_online ? 1 : -1;
      return a.plays - b.plays;
    });
}

/**
 * Units not yet ready to run: no zone, or no job to do. This is the
 * before-the-doors-open equivalent of {@link machinesNeedingAttention} —
 * judging a warehoused machine on its heartbeat tells an organizer nothing,
 * whereas an unplaced unit is a decision only they can make.
 */
export function machinesNeedingSetup(
  breakdown: MachineBreakdown[]
): MachineBreakdown[] {
  return breakdown.filter((m) => !m.zone?.trim() || !m.mission);
}

/** Why one unit isn't ready, as a phrase that completes "this unit ...". */
export function setupGapLabel(machine: MachineBreakdown): string {
  const noZone = !machine.zone?.trim();
  const noMission = !machine.mission;
  if (noZone && noMission) return "needs a zone and a job";
  if (noZone) return "needs a zone";
  return "needs a job";
}

/** Fleet-wide totals, so a roll-up never disagrees with the sum of its parts. */
export function fleetTotals(breakdown: MachineBreakdown[]) {
  return {
    machines: breakdown.length,
    online: breakdown.filter((m) => m.is_online).length,
    plays: breakdown.reduce((sum, m) => sum + m.plays, 0),
    leads: breakdown.reduce((sum, m) => sum + m.leads, 0),
    prizes: breakdown.reduce((sum, m) => sum + m.prizes, 0),
    rejected: breakdown.reduce((sum, m) => sum + m.rejected, 0),
  };
}
