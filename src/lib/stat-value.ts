/** Parses marketing stat strings into prefix / numeric value / suffix for animated count-up display. */

const STAT_NUMBER_RE = /((?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d+)?)/;

/**
 * Splits a marketing stat string into prefix / numeric value / suffix so the number can be animated, e.g. "92%" → {prefix:"", value:92, suffix:"%"}; "Up to 40%" → {prefix:"Up to ", value:40, suffix:"%"}; "24hr" → {value:24, suffix:"hr"}; "200,000" → {value:200000, suffix:""}. Returns null when no number is present (render the string statically).
 */
export function parseStatValue(
  raw: string
): { prefix: string; value: number; suffix: string } | null {
  if (!raw) return null;

  const match = raw.match(STAT_NUMBER_RE);
  if (!match || match.index === undefined) return null;

  const numStr = match[1];
  const prefix = raw.slice(0, match.index);
  const suffix = raw.slice(match.index + numStr.length);
  const value = parseFloat(numStr.replace(/,/g, ""));

  if (Number.isNaN(value)) return null;

  return { prefix, value, suffix };
}
