/**
 * Playwright config for Bright.Experience E2E journeys.
 *
 * The journeys live in `e2e/` and target a locally-running Next.js
 * production build (`npm run build && npm start`) so behaviour matches
 * production. Playwright manages the server lifecycle via `webServer`.
 *
 * In CI we run Chromium-only on PRs (~8 minutes) and add Firefox +
 * WebKit nightly via the `BROWSERS` env var. Locally the default
 * matches CI.
 */

import { defineConfig, devices } from "@playwright/test";

const baseUrl = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3000";
const browsers = (process.env.BROWSERS ?? "chromium").split(",");

export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  expect: { timeout: 5_000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: baseUrl,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    actionTimeout: 5_000,
    navigationTimeout: 10_000,
  },
  projects: [
    browsers.includes("chromium") && {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    browsers.includes("firefox") && {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },
    browsers.includes("webkit") && {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
    },
  ].filter(Boolean) as Parameters<typeof defineConfig>[0]["projects"],
  webServer: {
    command: process.env.PLAYWRIGHT_SKIP_WEBSERVER
      ? "echo 'using already-running server'"
      : "npm run build && npm run start",
    url: baseUrl,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    env: {
      // Test-mode endpoints (programmatic sign-in, DB reset) need both: the
      // build-level rewrite in next.config.ts keeps them out of production
      // routing, and the handlers check TEST_MODE.
      TEST_MODE: "1",
      ALLOW_TEST_AUTH_ROUTES: "1",
      // The harness builds in production mode but has no Postgres to point at,
      // so it runs on the in-memory mock. A production build ignores
      // NEXT_PUBLIC_MOCK_MODE unless this override is set — see
      // src/lib/supabase/mock/flag.ts.
      NEXT_PUBLIC_MOCK_MODE: "1",
      NEXT_PUBLIC_ALLOW_INSECURE_MOCK_AUTH: "1",
      NEXT_PUBLIC_SUPABASE_URL: "https://mock.local",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "mock-anon-key",
      NEXT_PUBLIC_SITE_URL: baseUrl,
      BOOKING_AUTO_PROVISION: "true",
      // checkRequiredEnv() throws at boot in production when any of these is
      // missing (src/lib/env.ts). The harness runs a production build, so it
      // has to supply the full set — dummy values, since nothing outbound is
      // exercised in E2E.
      SUPABASE_SERVICE_ROLE_KEY: "mock-service-role-key",
      CRON_SECRET: "e2e-cron-secret",
      RESEND_API_KEY: "e2e-resend-key",
      FROM_EMAIL: "e2e@brightblue.test",
      NEXT_PUBLIC_CALCOM_LINK: "brightblue/e2e",
      BRIGHTBLUE_WEBHOOK_SECRET: "e2e-bb-webhook-secret",
      CALCOM_WEBHOOK_SECRET: "e2e-cal-webhook-secret",
    },
  },
});
