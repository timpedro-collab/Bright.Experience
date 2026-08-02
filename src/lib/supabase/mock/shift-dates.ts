/**
 * Evergreen date shifting for the mock dataset.
 *
 * The hand-maintained seed (`dataset.ts` + `extra.ts`) was authored around a
 * single fixed "now" (`AUTHORED_NOW`). Left alone, the whole demo drifts into
 * the past — events that should be upcoming read as overdue, completed events
 * read as ancient. Rather than re-date hundreds of rows, we slide every date in
 * the dataset by `(today − AUTHORED_NOW)` days at load time. Relationships
 * between rows are preserved exactly (a task due 3 days before its event still
 * is), so the demo stays coherent and never goes stale.
 */

/** The date the static seed was authored against. All offsets are relative to this. */
const AUTHORED_NOW = "2026-06-18";

const DAY_MS = 24 * 60 * 60 * 1000;

// Strict patterns so UUIDs, postcodes, SKUs etc. are never mistaken for dates.
const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;
const ISO_DATETIME =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?(\.\d+)?(Z|[+-]\d{2}:\d{2})?$/;

/** Whole-day offset from `authored` to `today` (both compared at UTC midnight). */
export function shiftDaysFrom(authored: string = AUTHORED_NOW, today: Date = new Date()): number {
  const base = Date.parse(`${authored}T00:00:00Z`);
  const now = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
  return Math.round((now - base) / DAY_MS);
}

/**
 * Shift a single string by `days` if — and only if — it is an ISO date or
 * datetime. Format is preserved: date-only stays date-only, datetime keeps its
 * time component. Any other string is returned untouched.
 */
export function shiftDateString(value: string, days: number): string {
  if (DATE_ONLY.test(value)) {
    const t = Date.parse(`${value}T00:00:00Z`) + days * DAY_MS;
    return new Date(t).toISOString().slice(0, 10);
  }
  if (ISO_DATETIME.test(value)) {
    const t = Date.parse(value) + days * DAY_MS;
    return new Date(t).toISOString().replace(/\.\d{3}Z$/, "Z");
  }
  return value;
}

/**
 * Deep-clone-free recursive shift: walks arrays and plain objects, shifting any
 * date-like string value by `days`. Returns a new structure; the input is left
 * untouched. A zero offset returns the value as-is.
 */
export function shiftDates<T>(value: T, days: number): T {
  if (days === 0) return value;
  if (typeof value === "string") return shiftDateString(value, days) as unknown as T;
  if (Array.isArray(value)) {
    return value.map((v) => shiftDates(v, days)) as unknown as T;
  }
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = shiftDates(v, days);
    }
    return out as T;
  }
  return value;
}
