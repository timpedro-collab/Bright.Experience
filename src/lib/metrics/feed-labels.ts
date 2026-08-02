/**
 * Human labels for raw telemetry event types, and the mapping to the feed
 * items the live surfaces render.
 *
 * Extracted from the live route so the event-wide feed and the per-machine
 * feed on a machine page describe the same telemetry the same way — a lead
 * captured at the registration unit should not read differently depending on
 * which page you opened.
 */

/** What each telemetry event type reads as in a feed. */
export const TELEMETRY_FEED_LABELS: Record<string, string> = {
  play_started: "Game session started",
  play_completed: "Game completed",
  lead_captured: "New lead captured",
  prize_awarded: "Prize dispensed",
  heartbeat: "Machine check-in",
  interaction: "Screen interaction",
  survey_completed: "Survey submitted",
  linkedin_follow: "LinkedIn follow",
  qr_scan: "QR code scanned",
  capture_rejected_domain: "Personal email rejected",
  capture_duplicate_blocked: "Duplicate entry blocked",
};

/** A row as rendered by `LiveFeed`. */
export interface FeedItem {
  id: string;
  type: string;
  message: string;
  timestamp: string;
  /** Present when the telemetry row named a machine; used to filter per unit. */
  machineInstanceId: string | null;
}

/**
 * Icon/colour bucket for a feed row. `LiveFeed` styles on the coarse type
 * ("lead", "play", "prize") rather than the full event name, so an unknown
 * event type still renders rather than falling through to nothing.
 */
export function feedType(eventType: string): string {
  if (eventType.startsWith("lead")) return "lead";
  if (eventType.startsWith("play")) return "play";
  if (eventType.startsWith("prize")) return "prize";
  return eventType.replace(/_.*/, "");
}

/** Map one telemetry row to a feed item. */
export function feedItemFromTelemetry(row: {
  id?: unknown;
  event_type?: unknown;
  timestamp?: unknown;
  machine_instance_id?: unknown;
}): FeedItem {
  const eventType = String(row.event_type ?? "unknown");
  return {
    id: String(row.id ?? ""),
    type: feedType(eventType),
    message: TELEMETRY_FEED_LABELS[eventType] ?? eventType,
    timestamp: String(row.timestamp ?? ""),
    machineInstanceId: row.machine_instance_id
      ? String(row.machine_instance_id)
      : null,
  };
}
