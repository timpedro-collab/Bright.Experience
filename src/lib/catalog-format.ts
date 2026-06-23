/**
 * Catalog display formatting helpers.
 *
 * Package `features_json` is stored as terse machine slugs (e.g.
 * `setup_and_takedown`, `real_time_dashboard`). Rendering those raw looks
 * broken on customer-facing surfaces, so we map the known slugs to polished
 * copy and gracefully humanize anything unmapped.
 */

const FEATURE_LABELS: Record<string, string> = {
  setup_and_takedown: "Setup & takedown",
  onsite_brand_ambassador: "On-site brand ambassador",
  real_time_dashboard: "Real-time dashboard",
  next_day_report: "Next-day report",
  two_ambassadors: "Two brand ambassadors",
  branded_wrap: "Branded machine wrap",
  post_event_report: "Post-event report",
  full_creative_production: "Full creative production",
  two_ops: "Two on-site operators",
  live_event_dashboard: "Live event dashboard",
  custom_game_logic: "Custom game logic",
  tour_logistics: "Full tour logistics",
  dedicated_ae: "Dedicated account manager",
  cross_market_intelligence: "Cross-market intelligence",
  interim_reports: "Interim reports",
  executive_summary: "Executive summary",
  discovery_call: "Discovery call",
  tailored_creative: "Tailored creative",
  custom_capacity: "Custom capacity",
  bespoke_reporting: "Bespoke reporting",
};

/** Generic fallback: turn `some_value` / `some-value` into "Some value". */
function humanize(raw: string): string {
  const cleaned = raw.replace(/[_-]+/g, " ").trim();
  if (!cleaned) return raw;
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

/** Render a package feature slug as polished, human-readable copy. */
export function formatFeatureLabel(raw: string): string {
  if (!raw) return raw;
  const key = raw.trim().toLowerCase();
  return FEATURE_LABELS[key] ?? humanize(raw);
}

/** Human-readable duration label, e.g. "Single-day activation", "6-week program". */
export function formatDurationLabel(days?: number | null): string | null {
  if (!days) return null;
  if (days === 1) return "Single-day activation";
  if (days <= 7) return `${days}-day activation`;
  const weeks = Math.round(days / 7);
  return `${weeks}-week program`;
}
