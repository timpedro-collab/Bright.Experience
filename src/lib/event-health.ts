/**
 * Event health derivation — the chip is computed from reality, never read
 * straight off the stored column.
 *
 * The stored `health_status` is a manual escalation signal (an account
 * manager flagging trouble). It can only make the derived status WORSE,
 * never better: an event with ten overdue tasks reads "At risk" even if
 * nobody flipped the dot, and a wrapped event never shows "On track"
 * delivery chrome at all.
 *
 * Pure module (no server imports) — safe in client and server components.
 */
import type { HealthStatus, Stage } from "@/types";

/** Stages after the live window — delivery health no longer applies. */
const POST_LIVE_STAGES: Stage[] = ["reporting", "complete"];

/** Overdue-task thresholds: any lateness dents green; a pile-up is red. */
const OVERDUE_AMBER_AT = 1;
const OVERDUE_RED_AT = 3;

const SEVERITY: Record<HealthStatus, number> = { green: 0, amber: 1, red: 2 };

export interface EventHealthInput {
  /** Stored manual health flag — treated as an escalation floor. */
  healthStatus: HealthStatus;
  currentStage: Stage;
  eventDateStart: string;
  eventDateEnd?: string | null;
  /** Open tasks past their due date. Omit when the surface hasn't loaded tasks. */
  overdueTaskCount?: number;
  /** Injectable for tests. */
  now?: Date;
}

export type EventHealthChip =
  | { kind: "wrapped" }
  | { kind: "health"; status: HealthStatus };

function worst(a: HealthStatus, b: HealthStatus): HealthStatus {
  return SEVERITY[a] >= SEVERITY[b] ? a : b;
}

/** End of the event's last day (or first day when there's no end date). */
function eventEnd(input: EventHealthInput): Date {
  const end = new Date(input.eventDateEnd || input.eventDateStart);
  end.setHours(23, 59, 59, 999);
  return end;
}

/** True once the event reaches reporting/complete — wrap chrome replaces health. */
export function isEventWrapped(
  input: Pick<EventHealthInput, "currentStage">,
): boolean {
  return POST_LIVE_STAGES.includes(input.currentStage);
}

/**
 * Derive the status chip for an event:
 *
 * - reporting/complete → "wrapped" (never an On-track delivery chip)
 * - event date passed but stage never reached wrap → red (delivery slipped
 *   past the show date — the most alarming state there is)
 * - overdue tasks → amber (any) / red (3+), floored by the stored manual flag
 * - otherwise the stored flag stands
 */
export function deriveEventHealth(input: EventHealthInput): EventHealthChip {
  if (isEventWrapped(input)) return { kind: "wrapped" };

  const now = input.now ?? new Date();
  if (now > eventEnd(input)) {
    return { kind: "health", status: "red" };
  }

  let derived: HealthStatus = "green";
  const overdue = input.overdueTaskCount ?? 0;
  if (overdue >= OVERDUE_RED_AT) derived = "red";
  else if (overdue >= OVERDUE_AMBER_AT) derived = "amber";

  return { kind: "health", status: worst(derived, input.healthStatus) };
}
