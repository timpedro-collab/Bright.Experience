/**
 * Portfolio-level aggregate stats for internal surfaces.
 *
 * Both the internal home and the /ops command center need the same headline
 * numbers (total in flight, on-track vs at-risk, where events sit in the
 * pipeline). Computing them in one place keeps the two surfaces from drifting
 * — the home and ops always tell the same story.
 */
import { getEvents } from "@/lib/queries/events";
import { STAGE_CONFIG, type Stage, type Event } from "@/types";

const STAGE_ORDER: Stage[] = (Object.keys(STAGE_CONFIG) as Stage[]).sort(
  (a, b) => STAGE_CONFIG[a].order - STAGE_CONFIG[b].order,
);

export interface PortfolioStats {
  total: number;
  onTrack: number;
  atRisk: number;
  blocked: number;
  /** Events in the live stage right now. */
  live: number;
  /** Per-stage counts in pipeline order, with short axis labels. */
  stageData: { stage: Stage; name: string; count: number }[];
  /** The raw events, so callers can reuse without a second fetch. */
  events: Event[];
}

export async function getEventPortfolioStats(): Promise<PortfolioStats> {
  const events = await getEvents();

  const onTrack = events.filter((e) => e.healthStatus === "green").length;
  const blocked = events.filter((e) => e.healthStatus === "red").length;
  const atRisk = events.filter(
    (e) => e.healthStatus === "amber" || e.healthStatus === "red",
  ).length;
  const live = events.filter((e) => e.currentStage === "event_live").length;

  const stageData = STAGE_ORDER.map((stage) => ({
    stage,
    name: STAGE_CONFIG[stage].shortLabel,
    count: events.filter((e) => e.currentStage === stage).length,
  }));

  return { total: events.length, onTrack, atRisk, blocked, live, stageData, events };
}
