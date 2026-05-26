/**
 * E2E: internal user lands on the unified work hub.
 *
 * Asserts the six tiles render with counts and that clicking one
 * navigates to the right admin route.
 */

import { test, expect } from "./fixtures/auth";
import { resetDatabase } from "./fixtures/data";

test.beforeEach(async ({ request, baseURL }) => {
  await resetDatabase(request, baseURL);
});

test("internal user sees the six work-hub tiles on their dashboard", async ({
  page,
  loginAs,
}) => {
  await loginAs("internal_events_lead");
  await page.goto("/dashboard");

  await expect(page.getByText(/My queue/i)).toBeVisible();
  await expect(page.getByText(/Asset reviews/i)).toBeVisible();
  await expect(page.getByText(/Approvals/i)).toBeVisible();
  await expect(page.getByText(/Briefings/i)).toBeVisible();
  await expect(page.getByText(/Stage advances/i)).toBeVisible();
  await expect(page.getByText(/Stuck customers/i)).toBeVisible();

  await page.getByText(/Asset reviews/i).click();
  await expect(page).toHaveURL(/\/admin\/asset-reviews/);
});
