/**
 * Browser-side Sentry init.
 *
 * This lives at `src/instrumentation-client.ts` because that is the only
 * client entry point Next loads (since 15.3). The older `sentry.client.config.ts`
 * was silently ignored under Turbopack, so no browser error has ever been
 * reported — server errors were, which made the gap easy to miss.
 */
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.1,
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 1.0,
  enabled: process.env.NODE_ENV === "production",
});

/** Adds client-side navigations to traces so an error carries its route. */
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
