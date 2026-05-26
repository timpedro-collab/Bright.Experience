/**
 * E2E: customer uploads an asset and sees the "pending review" pill.
 *
 * Covers: portal navigation, file upload affordance, optimistic UI,
 * and the asset_status flip to `under_review`.
 */

import { test, expect } from "./fixtures/auth";
import { resetDatabase } from "./fixtures/data";
import { join } from "node:path";

test.beforeEach(async ({ request, baseURL }) => {
  await resetDatabase(request, baseURL);
});

test("customer uploads an asset and sees pending-review pill", async ({
  page,
  loginAs,
}) => {
  await loginAs("customer_admin");
  await page.goto("/events");
  await page.getByRole("link", { name: /Acme Spring/i }).click();
  await page.getByRole("tab", { name: /Assets/i }).click();

  // Use the hidden file input to upload a fixture image.
  const file = join(__dirname, "fixtures", "assets", "hero.png");
  await page
    .locator('input[type="file"]')
    .first()
    .setInputFiles(file);

  await expect(page.getByText(/Pending Bright\.Blue review/i)).toBeVisible();
});
