/** Telemetry types — physical machine instances, live events, leads, metrics. */

/** Operational status of a physical machine instance */
export type MachineInstanceStatus =
  | "available"
  | "deployed"
  | "maintenance"
  | "retired";

/** Discriminated union of telemetry event classifications */
export type TelemetryEventType =
  | "play_started"
  | "play_completed"
  | "lead_captured"
  | "prize_awarded"
  | "heartbeat"
  | "error";

/** A physical machine deployed to events, tracked by serial number */
export interface MachineInstance {
  id: string;
  machineTypeId: string;
  serialNumber: string;
  nickname?: string;
  currentEventId?: string;
  currentPlacementId?: string;
  status: MachineInstanceStatus;
  lastHeartbeat?: string;
  firmwareVersion?: string;
  createdAt: string;
  updatedAt: string;
}

/** A single telemetry data point emitted by a machine during an event */
export interface TelemetryEvent {
  id: string;
  machineInstanceId: string;
  eventId: string;
  eventType: TelemetryEventType;
  payloadJson: Record<string, unknown>;
  timestamp: string;
}

/** A lead captured via a machine interaction at an event */
export interface Lead {
  id: string;
  eventId: string;
  machineInstanceId?: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  customFieldsJson: Record<string, unknown>;
  source: string;
  capturedAt: string;
}

/** Aggregated event metrics for a single calendar day */
export interface EventMetricsSnapshot {
  id: string;
  eventId: string;
  snapshotDate: string;
  totalPlays: number;
  totalInteractions: number;
  totalLeads: number;
  totalPrizes: number;
  avgDwellTime?: number;
  peakHour?: number;
  customJson: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}
