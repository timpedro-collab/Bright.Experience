/**
 * Environment variable validation — runs once at import time.
 *
 * In development a missing variable is a warning: the demo runtime and the
 * mock Supabase client work without most of them. In production a missing
 * variable is fatal. Booting anyway is how you get a deployment where password
 * resets point at localhost, cron routes reject the scheduler because
 * `CRON_SECRET` is unset, or webhook signatures are never verified — all of
 * which fail silently and look like "the feature doesn't work".
 */

/**
 * Required everywhere. Without these the app cannot serve a single
 * authenticated request.
 */
const REQUIRED = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "NEXT_PUBLIC_SITE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
] as const;

/**
 * Additionally required in production. Each one guards a path that fails
 * quietly rather than loudly when the variable is missing:
 *   CRON_SECRET               — every cron route 401s, so nothing scheduled runs
 *   RESEND_API_KEY / FROM_EMAIL — no transactional email leaves the building
 *   NEXT_PUBLIC_CALCOM_LINK   — the booking step renders with nothing to book
 *   BRIGHTBLUE_WEBHOOK_SECRET — machine telemetry cannot be authenticated
 *   CALCOM_WEBHOOK_SECRET     — booking webhooks cannot be authenticated
 */
const REQUIRED_IN_PRODUCTION = [
  "CRON_SECRET",
  "RESEND_API_KEY",
  "FROM_EMAIL",
  "NEXT_PUBLIC_CALCOM_LINK",
  "BRIGHTBLUE_WEBHOOK_SECRET",
  "CALCOM_WEBHOOK_SECRET",
] as const;

const RECOMMENDED = [
  "BRIGHTBLUE_API_KEY",
  "NEXT_PUBLIC_SENTRY_DSN",
] as const;

/**
 * True during `next build`. The build runs with NODE_ENV=production but has no
 * business requiring runtime secrets — a CI image that can't build without the
 * production Resend key is worse than one that boots loudly without it.
 */
function isBuildPhase(): boolean {
  return process.env.NEXT_PHASE === "phase-production-build";
}

function missingFrom(keys: readonly string[]): string[] {
  return keys.filter((key) => !process.env[key]);
}

/**
 * Check required and recommended env vars.
 *
 * @throws in production (outside the build phase) when anything required is
 *   missing, so a misconfigured deployment fails at boot instead of at the
 *   first customer request.
 */
export function checkRequiredEnv(): void {
  const isProduction = process.env.NODE_ENV === "production";
  const required = isProduction
    ? [...REQUIRED, ...REQUIRED_IN_PRODUCTION]
    : [...REQUIRED];

  const missing = missingFrom(required);

  if (missing.length > 0) {
    const detail = `Missing required environment variables: ${missing.join(", ")}.`;

    if (isProduction && !isBuildPhase()) {
      throw new Error(
        `[env] ${detail} Refusing to boot — set them in the deployment ` +
          "environment. See .env.example for what each one does."
      );
    }

    console.warn(`[env] ${detail} The app may not work correctly.`);
  }

  const missingRecommended = missingFrom(RECOMMENDED);
  if (missingRecommended.length > 0) {
    console.info(
      `[env] Missing recommended environment variables: ${missingRecommended.join(", ")}. ` +
        "Some features (admin API, telemetry push, error reporting) will be unavailable."
    );
  }
}
