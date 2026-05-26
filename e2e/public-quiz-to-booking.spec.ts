/**
 * E2E: guest books a packaged moment end-to-end.
 *
 * Walks the public Book-Now flow — configure → checkout → confirmation —
 * proving the wizard hydrates with catalogue data, the checkout server
 * action accepts a guest contact + capability slugs, and the
 * confirmation page renders a receipt for an anonymous viewer.
 *
 * No login required; the booking funnel is entirely public.
 *
 * Stripe is stubbed (see STUBS-TO-REPLACE.md); the submit short-circuits
 * the payment intent and records a `quotes` row with status=`booked`.
 */

import { test, expect } from "@playwright/test";

const BOOKABLE_PACKAGE_SLUG = "bright-vend-single-day";

test("guest walks the configure → checkout → confirmation flow", async ({
  page,
}) => {
  await page.goto(`/book/configure?package=${BOOKABLE_PACKAGE_SLUG}`);

  await expect(
    page.getByRole("heading", { name: /Bright\.Vend/i })
  ).toBeVisible();

  // Step 1 — pick the first machine pill, then advance.
  await page.getByRole("button", { name: /Bright\.Vend\b/ }).first().click();
  await page.getByRole("button", { name: /^Next/i }).click();

  // Step 2 — pick the first game pill.
  await page.getByRole("button", { name: /Tap to Win|Spin & Reveal/i }).first().click();
  await page.getByRole("button", { name: /^Next/i }).click();

  // Step 3 — add-ons (optional). Skip ahead.
  await page.getByRole("button", { name: /^Next/i }).click();

  // Step 4 — dates.
  const today = new Date();
  const startDate = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);
  await page.getByLabel(/Start date/i).fill(startDate);

  await page
    .getByRole("button", { name: /Continue to Checkout/i })
    .click();

  await expect(page).toHaveURL(/\/book\/checkout/);
  await expect(
    page.getByRole("heading", { name: /Review|Checkout|Confirm/i })
  ).toBeVisible({ timeout: 10_000 });

  // Checkout form — use a randomised email so reruns don't collide.
  const email = `guest+${Date.now()}@bright.test`;
  await page.getByLabel(/Name/i).fill("Guest Tester");
  await page.getByLabel(/Email/i).fill(email);
  const phone = page.getByLabel(/Phone/i);
  if (await phone.isVisible().catch(() => false)) {
    await phone.fill("+44 7700 900000");
  }

  await page
    .getByRole("button", { name: /Pay|Book|Confirm/i })
    .first()
    .click();

  await expect(page).toHaveURL(/\/book\/confirmation\/[0-9a-f-]+/i, {
    timeout: 15_000,
  });
  await expect(page.getByText(/confirmed|booked|received/i)).toBeVisible();
});
