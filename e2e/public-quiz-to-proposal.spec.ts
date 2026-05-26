/**
 * E2E: a guest completes the public quiz, lands on a match, and
 * submits the proposal intake form. The AE should then see the new
 * row in /admin/quotes.
 */

import { test, expect } from "./fixtures/auth";
import { resetDatabase } from "./fixtures/data";

test.beforeEach(async ({ request, baseURL }) => {
  await resetDatabase(request, baseURL);
});

test("guest completes the quiz and submits a proposal intake", async ({
  page,
  loginAs,
}) => {
  await page.goto("/quiz");

  // Walk the quiz to its result — every step has a "Continue" button.
  for (let i = 0; i < 5; i += 1) {
    const continueBtn = page.getByRole("button", { name: /Continue|Next/i });
    if (!(await continueBtn.isVisible())) break;
    await page.getByRole("button").first().click();
    await continueBtn.click().catch(() => undefined);
  }

  await expect(page.getByText(/Your match/i)).toBeVisible();
  await page
    .getByRole("link", { name: /Request a tailored proposal/i })
    .click();

  await page.getByLabel(/Name/i).fill("Guest Tester");
  await page.getByLabel(/Email/i).fill("guest@test.local");
  await page.getByRole("button", { name: /Submit/i }).click();

  await expect(page.getByText(/Proposal request received/i)).toBeVisible();

  // Switch personas: AE should see the new quote
  await loginAs("internal_events_lead");
  await page.goto("/admin/quotes");
  await expect(page.getByText("guest@test.local")).toBeVisible();
});
