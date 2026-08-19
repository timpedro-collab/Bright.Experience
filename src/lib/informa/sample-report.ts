/**
 * The illustrative proof-of-performance report: what a sponsor receives
 * within 24 hours of a show closing, filled with sample data so it can be
 * shown before a single machine ships.
 *
 * Every number is internally consistent (hours sum to days, days sum to
 * headlines — enforced by tests) and stays inside the reach model's
 * physical ceilings (220 plays per machine-day, 90% opt-in), so the sample
 * never promises more than the configurator projects. Fields align with
 * the Tampa data addendum: plays, opted-in leads, session duration,
 * logged ad-loop content plays, fulfilment reconciled to stock.
 */

import { INDUSTRY_CPL } from "@/lib/informa/kit-math";

export interface SampleReportDay {
  label: string;
  plays: number;
  leads: number;
}

export interface SampleReportHour {
  /** "09:00" show-floor local time. */
  hour: string;
  plays: number;
}

export interface SampleLeadQualityRow {
  label: string;
  count: number;
  detail: string;
}

export const SAMPLE_REPORT = {
  meta: {
    label: "Sample report — illustrative data",
    product: "Show-Floor Takeover",
    show: "Three-day trade show, 8,000 attendees",
    priceUsd: 40_000,
    disclaimer:
      "Illustrative dataset for a mid-size three-day show at a $40,000 placement. Live reports carry the sponsor's actuals, delivered within 24 hours of show close.",
  },
  /** Day-by-day plays and opted-in leads. */
  byDay: [
    { label: "Day 1", plays: 198, leads: 178 },
    { label: "Day 2", plays: 216, leads: 196 },
    { label: "Day 3", plays: 187, leads: 167 },
  ] satisfies SampleReportDay[],
  /** Completed plays by show-floor hour, aggregated across the run. */
  byHour: [
    { hour: "09:00", plays: 38 },
    { hour: "10:00", plays: 71 },
    { hour: "11:00", plays: 87 },
    { hour: "12:00", plays: 74 },
    { hour: "13:00", plays: 66 },
    { hour: "14:00", plays: 83 },
    { hour: "15:00", plays: 78 },
    { hour: "16:00", plays: 62 },
    { hour: "17:00", plays: 42 },
  ] satisfies SampleReportHour[],
  /** Average completed-play session, seconds of hands-on brand time. */
  avgSessionSeconds: 96,
  /** What arrived with each opted-in lead. */
  leadQuality: [
    {
      label: "Opted in at the machine",
      count: 541,
      detail: "Consent captured before play, per badge scan",
    },
    {
      label: "Declared preferences attached",
      count: 489,
      detail: "In-game choices recorded against the lead",
    },
    {
      label: "Played to completion",
      count: 522,
      detail: "Full session with game score attached",
    },
  ] satisfies SampleLeadQualityRow[],
  /** The screen loop between plays: logged content plays, not estimates. */
  adLoop: {
    slots: 6,
    screens: 3,
    contentPlays: 5_430,
    note: "Every loop play is logged on the machine, so the count is measured, not modelled from footfall.",
  },
  /** Physical fulfilment, reconciled against loaded stock. */
  fulfilment: {
    samplesDispensed: 374,
    stockOuts: 0,
    note: "Wins dispense a sample; dispenses reconcile against loaded stock at close-out.",
  },
} as const;

/** Headline totals, derived from the day-by-day rows so they always agree. */
export function reportTotals(byDay: readonly SampleReportDay[]): {
  plays: number;
  leads: number;
} {
  return byDay.reduce(
    (acc, d) => ({ plays: acc.plays + d.plays, leads: acc.leads + d.leads }),
    { plays: 0, leads: 0 }
  );
}

/** Whole-dollar cost per opted-in lead for the sample placement. */
export function reportCpl(priceUsd: number, leads: number): number | null {
  if (leads <= 0 || priceUsd <= 0) return null;
  return Math.round(priceUsd / leads);
}

/** Percent (0-100, whole) of plays that produced an opted-in lead. */
export function optInRatePct(plays: number, leads: number): number {
  if (plays <= 0) return 0;
  return Math.round((leads / plays) * 100);
}

/** How far under the benchmark's low end the sample CPL lands, in percent. */
export function benchmarkSavingsPct(cpl: number): number {
  return Math.round(((INDUSTRY_CPL.low - cpl) / INDUSTRY_CPL.low) * 100);
}
