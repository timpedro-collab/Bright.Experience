/** Human labels for the intake "How did you hear about us?" values. */

const REFERRAL_SOURCE_LABELS: Record<string, string> = {
  event_saw_machine: "Saw a machine at an event",
  report_or_dashboard: "Someone shared a results report or live dashboard",
  referral: "A colleague or friend recommended you",
  search: "Search engine",
  social: "LinkedIn or social media",
  other: "Other",
};

/** Map a stored referral_source code to a display label, or null when unknown/empty. */
export function referralSourceLabel(value: string | null | undefined): string | null {
  if (value == null || !value.trim()) return null;
  return REFERRAL_SOURCE_LABELS[value] ?? null;
}
