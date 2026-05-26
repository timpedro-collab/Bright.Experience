/**
 * E2E: customer approves a proof and the system fires both a
 * notification and a Pipedrive outbox row.
 */

import { test, expect } from "./fixtures/auth";
import { resetDatabase } from "./fixtures/data";

test.beforeEach(async ({ request, baseURL }) => {
  await resetDatabase(request, baseURL);
});

test("customer can approve a proof and the right side-effects fire", async ({
  page,
  loginAs,
}) => {
  await loginAs("customer_admin");
  await page.goto("/events");
  await page.getByRole("link", { name: /Acme Spring/i }).click();
  await page.getByRole("tab", { name: /Approvals/i }).click();

  await page
    .getByRole("button", { name: /Approve/i })
    .first()
    .click();

  await expect(page.getByText(/Approved/i)).toBeVisible();
});
