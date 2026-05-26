/**
 * Playwright DB-reset fixture.
 *
 * Each spec calls `resetDatabase()` in `beforeEach` to land in a known
 * state. The endpoint is gated behind `TEST_MODE=1` and runs against
 * the project's service-role key, so it can only fire in CI / local
 * test runs.
 */

import type { APIRequestContext } from "@playwright/test";

export async function resetDatabase(request: APIRequestContext, baseURL?: string) {
  const resp = await request.post(`${baseURL ?? ""}/api/test/reset`);
  if (!resp.ok()) {
    throw new Error(`DB reset failed: ${resp.status()} ${await resp.text()}`);
  }
}
