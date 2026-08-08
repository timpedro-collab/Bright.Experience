/**
 * Event Wrapped — the story-format post-event artefact the marketer shares
 * to make themselves look good. Pure assembly of data the report already
 * carries: the headline number, the Bright Index placement, one human
 * moment, and a LinkedIn-ready share text.
 */

import type { NormalisedMetrics, Highlight } from "@/lib/reports/normalise";
import { pickHeadlineStat, type HeadlineStat } from "@/lib/reports/reveal";
import {
  computeIndexPlacement,
  pickComparisonRow,
  type IndexPlacement,
} from "@/lib/bright-index/percentile";
import {
  eventTypeLabel,
  type PublicBenchmarkRow,
} from "@/lib/bright-index/shape";
import { showDayCount } from "@/lib/metrics/expected-performance";

export interface WrappedStory {
  eventName: string;
  headline: HeadlineStat;
  /** Null when the benchmarks can't credibly place this event. */
  placement: IndexPlacement | null;
  /** The delivery lead's note first, else the strongest highlight. */
  humanMoment: { text: string; author: string | null } | null;
  /** e.g. "37% of players opted in" — null when plays weren't measured. */
  optInLine: string | null;
  /** "Campaign led by …" credit, passed through from the report surface. */
  credit: string | null;
  /** Pre-written share text the customer can paste straight into LinkedIn. */
  shareText: string;
}

export interface WrappedInput {
  eventName: string;
  eventType: string;
  eventDateStart: string;
  eventDateEnd?: string | null;
  metrics: NormalisedMetrics;
  personalNote?: string | null;
  personalNoteAuthor?: string | null;
  highlights: Highlight[];
  credit: string | null;
  benchmarks: PublicBenchmarkRow[];
}

/** Subject for placement claims, e.g. "brand activations" (lower-case plural). */
function placementSubject(eventType: string): string {
  const label = eventTypeLabel(eventType);
  return label.charAt(0).toLowerCase() + label.slice(1);
}

/**
 * Build the Wrapped story. Null when there is no headline number — a
 * wrapped with nothing to brag about would damage more than it delights.
 */
export function buildWrappedStory(input: WrappedInput): WrappedStory | null {
  const headline = pickHeadlineStat(input.metrics);
  if (!headline) return null;

  // Placement compares the event's own per-day lead rate against the pooled
  // index — the same basis the public /bright-index page publishes.
  const days = showDayCount(input.eventDateStart, input.eventDateEnd);
  const leadsPerDay = input.metrics.totalLeads / days;
  const placement = computeIndexPlacement(
    leadsPerDay,
    pickComparisonRow(input.benchmarks, {
      eventType: input.eventType,
      metricName: "leads_per_day",
    }),
    {
      subjectLabel: placementSubject(input.eventType),
      metricLabel: "opted-in leads per day",
    }
  );

  const firstCaption = input.highlights.find((h) => h.caption?.trim());
  const humanMoment = input.personalNote?.trim()
    ? {
        text: input.personalNote.trim(),
        author: input.personalNoteAuthor?.trim() || null,
      }
    : firstCaption
      ? { text: firstCaption.caption as string, author: null }
      : null;

  const optInLine =
    input.metrics.totalPlays > 0 && input.metrics.totalLeads > 0
      ? `${Math.round(
          (input.metrics.totalLeads / input.metrics.totalPlays) * 100
        )}% of players opted in`
      : null;

  const shareLines = [
    `${headline.value} ${headline.label} at ${input.eventName}.`,
  ];
  if (placement?.band === "top_quartile") {
    shareLines.push(placement.label + ".");
  }
  shareLines.push("Measured live at the machine — not modelled.");

  return {
    eventName: input.eventName,
    headline,
    placement,
    humanMoment,
    optInLine,
    credit: input.credit,
    shareText: shareLines.join(" "),
  };
}
