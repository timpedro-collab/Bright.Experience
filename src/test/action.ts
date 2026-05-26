/**
 * Convenience helper for invoking a Server Action under test.
 *
 * Most of our actions read `auth.getUser()` and then call Supabase via
 * `createClient()`. Rather than test the Next.js `"use server"`
 * runtime, we mock the two modules our actions import:
 *   - `@/lib/supabase/server` → return a controlled mock client
 *   - `@/lib/auth` → return a controlled user
 *
 * Test files should call `vi.mock("@/lib/supabase/server", ...)` and
 * `vi.mock("@/lib/auth", ...)` at the top of the file, then use
 * `withTestContext()` to set the active user + Supabase mock per test.
 *
 * The helper itself is intentionally tiny — most of the wiring lives
 * in test setup, this is just a convenience pattern.
 */

import { vi } from "vitest";
import type { MockSupabase } from "./supabase";
import type { User } from "@/types";

export interface TestContext {
  user: User | null;
  supabase: MockSupabase;
}

/**
 * Apply a context to the already-mocked `@/lib/supabase/server` and
 * `@/lib/auth` modules. Returns the context for assertion in the test.
 */
export function withTestContext(ctx: TestContext): TestContext {
  // Tests import these via `await import(...)` after calling vi.mock
  // — this helper centralises the pattern.
  ctx.supabase.setUser(
    ctx.user ? { id: ctx.user.id, email: ctx.user.email } : null
  );
  return ctx;
}

/**
 * Wire up the default action-side mocks. Call this in `beforeEach()`
 * inside server action test files. Returns a fresh context every time.
 */
export function setupActionMocks(): TestContext {
  // Importing inside the helper avoids forcing every test file to
  // configure its own mock graph.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { createMockSupabase } = require("./supabase") as typeof import("./supabase");
  const supabase = createMockSupabase();
  const user = {
    id: "00000000-0000-0000-0000-000000000001",
    name: "Tim Pedro",
    email: "tim@brightblue.test",
    role: "events_lead" as const,
  };

  // Re-wire the global mocks that test files have set up via vi.mock.
  // We use vi.mocked() inside individual tests when finer control is needed.
  vi.doMock("@/lib/supabase/server", () => ({
    createClient: vi.fn(async () => supabase),
  }));
  vi.doMock("@/lib/auth", () => ({
    getUser: vi.fn(async () => user),
  }));

  return { user, supabase };
}
