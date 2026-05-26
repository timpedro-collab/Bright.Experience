/**
 * E2E: guest accepts a proposal via the shareable link, and the
 * internal team sees the resulting in-portal notification.
 */

import { test, expect } from "./fixtures/auth";
import { resetDatabase } from "./fixtures/data";

test.beforeEach(async ({ request, baseURL }) => {
  await resetDatabase(request, baseURL);
});

test("guest can accept a delivered proposal", async ({ page, loginAs }) => {
  // The test DB seed creates a delivered proposal with the slug
  // `acme-proposal-001` and a recipient email.
  await page.goto("/proposal/acme-proposal-001");
  await page.getByRole("button", { name: /Accept proposal/i }).click();
  await expect(page.getByText(/Proposal accepted/i)).toBeVisible();

  // The internal AE should see the resulting notification.
  await loginAs("internal_events_lead");
  await page.goto("/notifications");
  await expect(page.getByText(/Proposal accepted/i)).toBeVisible();
});
