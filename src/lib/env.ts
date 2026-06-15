/**
 * Environment variable validation — runs once at import time.
 *
 * Logs clear warnings for missing required vars and info-level notices
 * for missing recommended (optional) vars so production issues surface
 * early in the deploy log rather than on first request.
 */

const REQUIRED = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "NEXT_PUBLIC_SITE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
] as const;

const RECOMMENDED = [
  "RESEND_API_KEY",
  "BRIGHTBLUE_API_KEY",
] as const;

/** Check required and recommended env vars, logging any that are missing. */
export function checkRequiredEnv(): void {
  const missing: string[] = [];

  for (const key of REQUIRED) {
    if (!process.env[key]) {
      missing.push(key);
    }
  }

  if (missing.length > 0) {
    console.warn(
      `[env] Missing REQUIRED environment variables: ${missing.join(", ")}. ` +
        "The app may not work correctly."
    );
  }

  const missingRecommended: string[] = [];
  for (const key of RECOMMENDED) {
    if (!process.env[key]) {
      missingRecommended.push(key);
    }
  }

  if (missingRecommended.length > 0) {
    console.info(
      `[env] Missing recommended environment variables: ${missingRecommended.join(", ")}. ` +
        "Some features (email, admin API, telemetry) will be unavailable."
    );
  }
}
