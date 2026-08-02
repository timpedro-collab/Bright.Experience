/**
 * Reports a failed database read that the caller is about to swallow.
 *
 * Read helpers in `src/lib/queries/**` deliberately degrade to empty data on
 * failure so a broken query renders an empty section instead of a 500. That is
 * the right behaviour for the customer and the wrong behaviour for us: without
 * a report, "the database is down" and "this event genuinely has no tasks" look
 * identical. Every one of those branches calls `logQueryError` so the failure
 * reaches Sentry even though the request succeeds.
 */
import * as Sentry from "@sentry/nextjs";

/** Anything Supabase (or a thrown value) can hand us in an error position. */
export type QueryErrorLike =
  | { message?: string; code?: string; details?: string; hint?: string }
  | Error
  | string
  | null
  | undefined;

/**
 * Identifying context for the failing read. Keep these to non-PII scalars —
 * ids, slugs, statuses — because they are sent to Sentry as searchable tags.
 */
export type QueryErrorContext = Record<
  string,
  string | number | boolean | null | undefined
>;

function messageOf(error: QueryErrorLike): string {
  if (!error) return "unknown error";
  if (typeof error === "string") return error;
  if (error instanceof Error) return error.message;
  return error.message ?? "unknown error";
}

function codeOf(error: QueryErrorLike): string | undefined {
  if (!error || typeof error === "string" || error instanceof Error) return undefined;
  return error.code;
}

/**
 * Report a swallowed query failure.
 *
 * @param operation Name of the calling function, e.g. `getEventById`. Used as
 *   the Sentry fingerprint so one broken query groups into one issue rather
 *   than one issue per distinct Postgres message.
 * @param error The Supabase `error` object (or anything error-shaped).
 * @param context Extra scalars to attach — the entity id is the useful one.
 */
export function logQueryError(
  operation: string,
  error: QueryErrorLike,
  context: QueryErrorContext = {}
): void {
  // A null error with missing data is an ordinary "no rows" outcome, not a
  // failure, so callers can pass the error position through unconditionally.
  if (!error) return;

  const code = codeOf(error);
  const message = messageOf(error);

  // Server logs stay useful without Sentry configured (local, CI, preview).
  console.error(`[query:${operation}] ${message}`, { code, ...context });

  Sentry.withScope((scope) => {
    scope.setTag("query.operation", operation);
    if (code) scope.setTag("query.code", code);
    scope.setContext("query", { operation, code, ...context });
    scope.setFingerprint(["query-error", operation, code ?? message]);
    Sentry.captureException(
      error instanceof Error ? error : new Error(`${operation}: ${message}`)
    );
  });
}
