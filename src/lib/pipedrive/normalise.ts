/**
 * Pure helpers for normalising Pipedrive identifiers.
 *
 * Lives in a plain library module (not under `app/actions`) so it can be
 * imported by server actions, server components, and unit tests without
 * tripping the Next.js rule that everything exported from a `"use server"`
 * file must be an async function.
 */

/**
 * Normalise a Pipedrive deal reference. Accepts either a numeric ID
 * (`"1234"`), a full deal URL (`https://acme.pipedrive.com/deal/1234`),
 * or the empty string. Returns the numeric ID as a string, or null.
 */
export function normalisePipedriveDealId(raw?: string): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (trimmed === "") return null;
  // Match the trailing numeric segment of a Pipedrive URL or a bare ID.
  const match = trimmed.match(/(\d+)\/?$/);
  return match ? match[1] : null;
}
