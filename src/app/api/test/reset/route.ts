/**
 * Test-only DB reset endpoint — returns a known-good state for E2E runs.
 *
 * Gated behind `TEST_MODE=1` so it can never activate in production.
 * The Playwright data fixture (`e2e/fixtures/data.ts`) calls this in
 * `beforeEach` to make specs independent of execution order.
 *
 * Currently a no-op that returns 200 — replace with actual seed logic
 * once the test database fixture is wired up.
 */

import { NextResponse } from "next/server";

export async function POST() {
  if (process.env.TEST_MODE !== "1") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // TODO: wire up actual DB reset via getServiceRoleClient() once
  // the test seed SQL is in place. For now the E2E specs rely on the
  // standard seed data applied during `npm run build`.
  return NextResponse.json({ success: true, message: "Test data reset (no-op)" });
}
