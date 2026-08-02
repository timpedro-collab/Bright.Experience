/** Pure helpers shared by the home page's internal + customer views. */

import type { Event } from "@/types";
import type { PlateStatusTone } from "@/components/brand";

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

/** Friendly first-name greeting. */
export function firstName(name?: string): string {
  if (!name) return "there";
  return name.split(" ")[0] ?? name;
}
