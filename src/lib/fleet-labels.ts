/**
 * Display labels for fleet machine missions.
 *
 * Kept in a plain module (not a component) so server components, client
 * components, and report builders all render a mission the same way.
 */

import type { MachineMission } from "@/types";

/** Short label for a machine's mission, for chips and table cells. */
export const MISSION_LABELS: Record<MachineMission, string> = {
  lead_capture: "Lead capture",
  sponsor_activation: "Sponsor activation",
  welcome_gift: "Welcome gift",
  rebook_reward: "Rebook reward",
  sampling: "Sampling",
};

/** One-line explanation of what a machine on this mission is there to do. */
export const MISSION_DESCRIPTIONS: Record<MachineMission, string> = {
  lead_capture: "Plays a game and captures a qualified contact for the brand.",
  sponsor_activation: "Runs a sponsor's branded game on their bought slot.",
  welcome_gift: "Hands arriving attendees something on the way in.",
  rebook_reward: "Rewards exhibitors who commit to next year's show.",
  sampling: "Puts product in hands, with no game gate.",
};

/** Mission label, falling back to a readable dash for unassigned units. */
export function missionLabel(mission?: MachineMission | null): string {
  return mission ? MISSION_LABELS[mission] : "Unassigned";
}
