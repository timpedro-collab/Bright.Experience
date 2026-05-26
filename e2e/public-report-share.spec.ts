/**
 * E2E: post-event report share links are token-gated.
 *
 * The seed publishes one report with `share_token = 'share-samsung-launch'`.
 * We assert that:
 *   1. The published token renders KPI cards (normalised metric reader).
 *   2. An unknown / unpublished token 404s.
 *
 * No auth required — the share page is intentionally public so customers
 * can forward it to their team.
 */

import { test, expect } from "@playwright/test";

test("a valid share token renders the public report", async ({ page }) => {
  await page.goto("/report/share-samsung-launch");
  await expect(
    page.getByRole("heading", { name: /Samsung Galaxy Launch/i })
  ).toBeVisible();

  // KPI tile labels from the public report view.
  await expect(page.getByText(/Total plays/i)).toBeVisible();
  await expect(page.getByText(/Total leads/i)).toBeVisible();
});

test("an unknown share token returns not-found", async ({ page }) => {
  const resp = await page.goto("/report/not-a-real-token");
  expect(resp?.status()).toBe(404);
});
