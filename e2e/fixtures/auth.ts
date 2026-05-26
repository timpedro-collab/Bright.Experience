/**
 * Playwright auth fixture.
 *
 * Most journeys need a logged-in user. Rather than running through
 * Supabase Auth UI (slow, brittle), we expose a `/api/test/login`
 * endpoint that issues a session cookie for the requested persona.
 *
 * That endpoint is registered only when `TEST_MODE=1`, so production
 * builds cannot be tricked into impersonating a user.
 */

import { test as base, expect } from "@playwright/test";

export type Persona =
  | "internal_admin"
  | "internal_events_lead"
  | "internal_creative_lead"
  | "customer_admin"
  | "customer_user";

export const test = base.extend<{
  loginAs: (persona: Persona) => Promise<void>;
}>({
  loginAs: async ({ page, baseURL }, use) => {
    // Playwright's `use` fixture API collides with the React hook naming
    // convention; this is a test fixture, not a React hook.
    // eslint-disable-next-line react-hooks/rules-of-hooks
    await use(async (persona: Persona) => {
      const resp = await page.request.post(
        `${baseURL ?? ""}/api/test/login`,
        { data: { persona } }
      );
      if (!resp.ok()) {
        throw new Error(
          `Test login failed for ${persona}: ${resp.status()} ${await resp.text()}`
        );
      }
    });
  },
});

export { expect };
