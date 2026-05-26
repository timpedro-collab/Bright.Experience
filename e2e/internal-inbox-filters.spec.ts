/**
 * E2E: internal user filters the cross-event inbox.
 *
 * Verifies that selecting a filter rewrites the URL, that hitting
 * refresh keeps the filter applied, and that the "all" option clears
 * the param.
 */

import { test, expect } from "./fixtures/auth";
import { resetDatabase } from "./fixtures/data";

test.beforeEach(async ({ request, baseURL }) => {
  await resetDatabase(request, baseURL);
});

test("inbox filters write to the URL and persist on reload", async ({
  page,
  loginAs,
}) => {
  await loginAs("internal_events_lead");
  await page.goto("/inbox");

  await page.getByRole("combobox", { name: /Status/i }).click();
  await page.getByRole("option", { name: /Open/i }).click();
  await expect(page).toHaveURL(/status=open/);

  await page.reload();
  await expect(page).toHaveURL(/status=open/);

  await page.getByRole("combobox", { name: /Status/i }).click();
  await page.getByRole("option", { name: /All/i }).click();
  await expect(page).not.toHaveURL(/status=open/);
});
