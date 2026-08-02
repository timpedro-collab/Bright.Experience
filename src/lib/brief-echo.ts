/**
 * Brief echo — plays the customer's own quiz/intake answers back to them.
 *
 * The quiz and intake wizard capture a rich brief (moment, goal, place, dates,
 * crowd, projected reach) that used to travel silently to the AE. These
 * helpers turn that raw form state into short, human lines so the wizard and
 * the confirmation screen can visibly prove "we were listening" instead of
 * showing a generic thank-you.
 *
 * Pure module — string in, string out — so both client components share one
 * tested source of truth for the echo copy.
 */

import { formatDateMedium, formatDateShort } from "@/lib/dates";
import { formatNumberUS } from "@/lib/currency";

export interface BriefEchoInput {
  eventType?: string | null;
  objective?: string | null;
  venueName?: string | null;
  activationLocation?: string | null;
  postcode?: string | null;
  eventDateStart?: string | null;
  eventDateEnd?: string | null;
  /** Numeric string straight from the wizard state (e.g. "2500"). */
  attendees?: string | null;
  footfallEstimate?: string | null;
  /** Numeric string straight from the wizard state (e.g. "3"). */
  activationDays?: string | null;
  eventTimeline?: string | null;
}

export interface EchoItem {
  label: string;
  value: string;
}

/** Customer-facing phrase for each intake event type. */
const EVENT_TYPE_LABELS: Record<string, string> = {
  activation: "A brand activation",
  sampling: "Product sampling",
  vending: "Branded vending",
  hybrid: "A hybrid experience",
  retail: "A retail activation",
  custom: "Something custom",
};

/** Mirrors the quiz's timeline options (kept local — lib must not import components). */
const TIMELINE_LABELS: Record<string, string> = {
  "within-month": "Within a month",
  "1-3-months": "In 1–3 months",
  "3-6-months": "In 3–6 months",
  exploring: "Date still open",
};

const posInt = (v: string | null | undefined): number | null => {
  if (!v) return null;
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? Math.round(n) : null;
};

/** "5000-10000" → "5,000–10,000 expected visitors"; free text passes through. */
function footfallLine(raw: string): string {
  const m = raw.trim().match(/^(\d+)\s*-\s*(\d+)$/);
  if (m) {
    return `${formatNumberUS(Number(m[1]))}–${formatNumberUS(Number(m[2]))} expected visitors`;
  }
  return raw.trim();
}

/**
 * Build the ordered "what you told us" lines from the intake form state.
 * Only answers the customer actually gave are included, so the list never
 * shows blanks or placeholders.
 */
export function briefEchoItems(input: BriefEchoInput): EchoItem[] {
  const items: EchoItem[] = [];

  const moment = EVENT_TYPE_LABELS[input.eventType?.trim() ?? ""];
  if (moment) items.push({ label: "The moment", value: moment });

  const objective = input.objective?.trim();
  if (objective) items.push({ label: "Your goal", value: objective });

  const place = input.venueName?.trim() || input.activationLocation?.trim();
  if (place) {
    const postcode = input.postcode?.trim();
    items.push({
      label: "Where",
      value: postcode ? `${place} (${postcode})` : place,
    });
  }

  const start = input.eventDateStart?.trim();
  const end = input.eventDateEnd?.trim();
  if (start) {
    items.push({
      label: "When",
      value:
        end && end !== start
          ? `${formatDateShort(start)}–${formatDateMedium(end)}`
          : formatDateMedium(start),
    });
  } else {
    const timeline = TIMELINE_LABELS[input.eventTimeline?.trim() ?? ""];
    if (timeline) items.push({ label: "When", value: timeline });
  }

  const attendees = posInt(input.attendees);
  if (attendees) {
    items.push({
      label: "The crowd",
      value: `~${formatNumberUS(attendees)} attendees`,
    });
  } else if (input.footfallEstimate?.trim()) {
    items.push({ label: "The crowd", value: footfallLine(input.footfallEstimate) });
  }

  const days = posInt(input.activationDays);
  if (days) {
    items.push({
      label: "On site",
      value: `${days} day${days === 1 ? "" : "s"}`,
    });
  }

  return items;
}
