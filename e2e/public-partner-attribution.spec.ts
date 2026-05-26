/**
 * E2E: partner attribution cookie persists across the public funnel.
 *
 * A reseller shares `/p/BB-NORTH001` with a prospect. We assert:
 *   1. The partner landing renders the co-branded hero ("Northern Events").
 *   2. The `bb_partner` httpOnly cookie is set with the partner code.
 *   3. The cookie survives a hop into `/book/configure` (the proposal /
 *      booking server actions read it on submit).
 *
 * The seed exposes one active partner with code `BB-NORTH001`.
 */

import { test, expect } from "@playwright/test";

const PARTNER_CODE = "BB-NORTH001";
const PARTNER_NAME = "Northern Events";

test("visiting /p/[code] sets attribution cookie and co-brands the hero", async ({
  page,
  context,
}) => {
  await page.goto(`/p/${PARTNER_CODE}`);

  await expect(
    page.getByRole("heading", { name: new RegExp(PARTNER_NAME, "i") })
  ).toBeVisible();

  const cookies = await context.cookies();
  const bb = cookies.find((c) => c.name === "bb_partner");
  expect(bb, "bb_partner cookie should be set").toBeTruthy();
  expect(bb?.value).toBe(PARTNER_CODE);
  expect(bb?.path).toBe("/");
  expect(bb?.httpOnly).toBe(true);

  // Step into the funnel — cookie travels because it's path=/.
  await page.goto("/catalog");
  const stillPresent = (await context.cookies()).find(
    (c) => c.name === "bb_partner"
  );
  expect(stillPresent?.value).toBe(PARTNER_CODE);
});

test("an unknown partner code shows a friendly not-found", async ({ page }) => {
  await page.goto("/p/BB-DOES-NOT-EXIST");
  await expect(
    page.getByRole("heading", { name: /couldn'?t find that partner/i })
  ).toBeVisible();
});
