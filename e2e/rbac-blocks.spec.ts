/**
 * E2E: RBAC blocks.
 *
 * Non-internal personas must not reach any `/admin/*` route. The
 * server redirects them to `/` instead.
 */

import { test, expect } from "./fixtures/auth";
import { resetDatabase } from "./fixtures/data";

test.beforeEach(async ({ request, baseURL }) => {
  await resetDatabase(request, baseURL);
});

const adminRoutes = [
  "/admin",
  "/admin/asset-reviews",
  "/admin/quotes",
  "/admin/integrations/pipedrive",
];

for (const route of adminRoutes) {
  test(`customer is redirected away from ${route}`, async ({ page, loginAs }) => {
    await loginAs("customer_admin");
    await page.goto(route);
    await expect(page).not.toHaveURL(new RegExp(route));
  });
}

test("anonymous visitor is sent to sign-in for /admin", async ({ page }) => {
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/login|\/sign-in|\/$/);
});
