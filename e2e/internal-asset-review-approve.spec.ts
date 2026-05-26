/**
 * E2E: internal user approves an asset.
 *
 * Covers /admin/asset-reviews, the AssetReviewQueue expand-row, and
 * the approve branch. After approval the customer should see the
 * green "Approved" pill on their next load.
 */

import { test, expect } from "./fixtures/auth";
import { resetDatabase } from "./fixtures/data";

test.beforeEach(async ({ request, baseURL }) => {
  await resetDatabase(request, baseURL);
});

test("internal user approves a customer-uploaded asset", async ({
  page,
  loginAs,
}) => {
  await loginAs("internal_creative_lead");
  await page.goto("/admin/asset-reviews");

  await page.getByText("hero.png").first().click();
  await page.getByRole("button", { name: /Approve/i }).click();

  await expect(page.getByText(/Approved/i)).toBeVisible();
});
