/**
 * Display labels for game configuration choices.
 *
 * Kept in a plain module so the configuration form (which sets these) and the
 * read-only views that report them — the organizer machine page, reports —
 * describe the same setting with the same words.
 */

import type { PrizeMode, CaptureMethod } from "@/app/actions/game-config";

export interface ConfigOption<T> {
  value: T;
  label: string;
  description: string;
}

export const PRIZE_MODES: ConfigOption<PrizeMode>[] = [
  {
    value: "random",
    label: "Random",
    description:
      "The machine picks each prize at random. Often the choice when there's a variety of prizes and the surprise reveal is part of the fun.",
  },
  {
    value: "score_based",
    label: "Score-based",
    description:
      "Players win by reaching a target score. Adds challenge, drives repeat plays, and keeps premium prizes behind a real threshold.",
  },
  {
    value: "guaranteed",
    label: "Guaranteed",
    description:
      "The winning score is set so low that every player wins. The go-to for sampling, where everyone should walk away with something.",
  },
];

export const CAPTURE_METHODS: ConfigOption<CaptureMethod>[] = [
  {
    value: "form",
    label: "Entry form",
    description:
      "The attendee types their details on the machine. Collects the most context, including any custom questions you add above.",
  },
  {
    value: "badge_scan",
    label: "Badge scan",
    description:
      "Scanning the event badge unlocks the game and fills the contact from registration data. Highest data quality, no typos, but only the fields the organizer holds.",
  },
  {
    value: "both",
    label: "Either",
    description:
      "Badge scan for speed, form as the fallback for anyone without a badge. Safest choice when you can't guarantee every visitor is registered.",
  },
];

/** Short label for a prize mode, falling back to the raw value. */
export function prizeModeLabel(mode: PrizeMode | null | undefined): string {
  return PRIZE_MODES.find((m) => m.value === mode)?.label ?? String(mode ?? "—");
}

/** Short label for a capture method, falling back to the raw value. */
export function captureMethodLabel(method: CaptureMethod | null | undefined): string {
  return (
    CAPTURE_METHODS.find((m) => m.value === method)?.label ?? String(method ?? "—")
  );
}
