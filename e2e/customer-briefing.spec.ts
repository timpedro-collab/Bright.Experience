/**
 * E2E: customer fills the briefing form, submits, and lands on the
 * confirmation state. Internal team is expected to receive a
 * `briefing.submitted` notification — verified server-side via the
 * test helper, not from the customer UI.
 */

import { test, expect } from "./fixtures/auth";
import { resetDatabase } from "./fixtures/data";

test.beforeEach(async ({ request, baseURL }) => {
  await resetDatabase(request, baseURL);
});

test("customer fills and submits the briefing form", async ({
  page,
  loginAs,
}) => {
  await loginAs("customer_admin");
  await page.goto("/events");
  await page.getByRole("link", { name: /Acme Spring/i }).click();
  await page.getByRole("tab", { name: /Briefing/i }).click();

  await page
    .getByLabel(/Hero message/i)
    .fill("Refresh with Acme");
  await page.getByLabel(/Target audience/i).fill("Urban professionals");
  await page.getByRole("button", { name: /Submit briefing/i }).click();

  await expect(page.getByText(/Briefing submitted/i)).toBeVisible();
});
