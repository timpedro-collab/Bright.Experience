/**
 * Shared server action result types.
 *
 * Every server action returns `ActionResult<T>` — callers pattern-match
 * on `result.success` instead of catching thrown errors.
 */

export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };
