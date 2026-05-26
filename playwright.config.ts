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
      // Test-mode endpoints (programmatic sign-in, DB reset) are gated
      // behind this env var so they can't accidentally ship to prod.
      TEST_MODE: "1",
    },
  },
});
