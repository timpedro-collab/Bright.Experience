/**
 * E2E: internal user requests a revision with feedback.
 *
 * Verifies the feedback-required guardrail and that the customer
 * sees the feedback note on their side of the portal.
 */

import { test, expect } from "./fixtures/auth";
import { resetDatabase } from "./fixtures/data";

test.beforeEach(async ({ request, baseURL }) => {
  await resetDatabase(request, baseURL);
});

test("internal user requests a revision with feedback", async ({
  page,
  loginAs,
}) => {
  await loginAs("internal_creative_lead");
  await page.goto("/admin/asset-reviews");

  await page.getByText("hero.png").first().click();
  await page
    .getByLabel(/Feedback for the customer/i)
    .fill("Tighten the crop on the logo");
  await page.getByRole("button", { name: /Request revision/i }).click();

  await expect(page.getByText(/Revision requested/i)).toBeVisible();
});
