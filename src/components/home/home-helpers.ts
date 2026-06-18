/** Pure helpers shared by the home page's internal + customer views. */

import type { Event, Stage } from "@/types";
import type { PlateStatusTone } from "@/components/brand";
import { stageLabelFor } from "@/lib/customer-copy";

/**
 * Pick the event the customer most wants to see first. We prefer:
 *   1) anything currently blocked (red)
 *   2) the closest upcoming event still in delivery
 *   3) the most recently active event we have
 */
export function pickFeaturedEvent(events: Event[]): Event | null {
  if (events.length === 0) return null;
  const blocked = events.find((e) => e.healthStatus === "red");
  if (blocked) return blocked;
  const now = Date.now();
  const upcoming = events
    .filter((e) => new Date(e.eventDateStart).getTime() >= now)
    .sort(
      (a, b) =>
        new Date(a.eventDateStart).getTime() -
        new Date(b.eventDateStart).getTime(),
    )[0];
  return upcoming ?? events[0];
}

/**
 * Render-safe lifecycle phrase. The event's STAGE is the source of truth:
 * an event is only "Wrapped" once it reaches reporting/complete — never
 * because its calendar date slipped past while the stage stood still.
 * Returns `"26d · 06h"` countdown, `"Live now"` once the event window has
 * opened (and until it's reported), or `"Wrapped"` when delivered.
 */
export function timeUntil(event: Event): string {
  const stage = event.currentStage as Stage;
  if (stage === "reporting" || stage === "complete") return "Wrapped";
  const start = new Date(event.eventDateStart).getTime();
  const now = Date.now();
  // Window has opened (or date passed) but not yet reported → still in delivery.
  if (now >= start) return "Live now";
  const diffMs = start - now;
  const days = Math.floor(diffMs / 86_400_000);
  const hours = Math.floor((diffMs % 86_400_000) / 3_600_000);
  return `${days}d · ${String(hours).padStart(2, "0")}h`;
}

/** Map an event's health into a tone for the on-track pill. */
export function healthLabel(event: Event): {
  label: string;
  tone: PlateStatusTone;
} {
  if (event.healthStatus === "red")
    return { label: "Blocked", tone: "warning" };
  if (event.healthStatus === "amber")
    return { label: "At risk", tone: "warning" };
  if (event.currentStage === "event_live")
    return { label: "Live", tone: "live" };
  if (event.currentStage === "complete" || event.currentStage === "reporting")
    return { label: "Wrap", tone: "wrap" };
  return { label: "On track", tone: "active" };
}

/**
 * Sequence of operational stages in the order they happen, used by the
 * Progress column to show the customer where they are and what's next.
 */
const STAGE_ORDER: Stage[] = [
  "confirmed",
  "kickoff_complete",
  "creative_assets",
  "approvals",
  "build_configuration",
  "qa_readiness",
  "logistics_confirmed",
  "event_live",
  "reporting",
  "complete",
];

/**
 * Return the current stage plus the next two upcoming stages. We
 * deliberately limit to three rows so the column has the same calm
 * editorial density as the "Waiting on you" and "From your team"
 * columns — no chapter narrative, no Roman numerals, just the next
 * few real operational stages.
 */
export function getProgressRows(event: Event): Array<{
  id: Stage;
  label: string;
  status: "in progress" | "up next" | "complete";
  active: boolean;
}> {
  const currentIdx = STAGE_ORDER.indexOf(event.currentStage as Stage);
  if (currentIdx === -1) return [];
  return STAGE_ORDER.slice(currentIdx, currentIdx + 3).map((stage, i) => ({
    id: stage,
    label: stageLabelFor(stage, true),
    status: i === 0 ? "in progress" : "up next",
    active: i === 0,
  }));
}

/** Friendly first-name greeting. */
export function firstName(name?: string): string {
  if (!name) return "there";
  return name.split(" ")[0] ?? name;
}
