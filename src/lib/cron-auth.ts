/**
 * Cron route authentication.
 *
 * Cron routes must only run for the real scheduler. Vercel Cron sends an
 * `Authorization: Bearer ${CRON_SECRET}` header on every invocation when
 * CRON_SECRET is set in the project. We require that bearer unconditionally.
 *
 * Previously these routes also trusted the presence of an `x-vercel-cron`
 * header, which any external caller can spoof — that bypass is removed.
 */

export function requireCron(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return request.headers.get("authorization") === `Bearer ${secret}`;
}
