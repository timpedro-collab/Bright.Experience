/** Derives the live-dashboard badge state from an event's stage and dates. */
import type { Event, Stage } from "@/types";
import { formatDateMedium } from "@/lib/dates";

export type LiveState = "live" | "standby" | "ended" | "scheduled";

export interface LiveStatus {
  state: LiveState;
  /** Human-readable start date label for the "scheduled" state. */
  startLabel?: string;
}

const POST_LIVE_STAGES: Stage[] = ["reporting", "complete"];

/**
 * Determine the live-dashboard badge state from event stage and date range.
 *
 * - `event_live` + within date window → "live"
 * - `event_live` + outside date window → "standby"
 * - reporting / complete → "ended"
 * - any earlier stage → "scheduled"
 */
export function deriveLiveStatus(event: Pick<Event, "currentStage" | "eventDateStart" | "eventDateEnd">): LiveStatus {
  if (POST_LIVE_STAGES.includes(event.currentStage)) {
    return { state: "ended" };
  }

  if (event.currentStage === "event_live") {
    const now = new Date();
    const start = new Date(event.eventDateStart);
    const end = event.eventDateEnd ? new Date(event.eventDateEnd) : start;

    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    if (now >= start && now <= end) {
      return { state: "live" };
    }
    return { state: "standby" };
  }

  return {
    state: "scheduled",
    startLabel: formatDateMedium(event.eventDateStart),
  };
}
