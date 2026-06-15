/**
 * Global test setup, loaded once per worker by Vitest.
 *
 * Responsibilities:
 *   - Wire `@testing-library/jest-dom` matchers into Vitest's `expect`
 *   - Reset mocks between tests so suites don't leak state
 *   - Provide env-var defaults so modules that read process.env at
 *     import time (the Supabase client, Pipedrive client, etc.) don't
 *     blow up in the test environment
 *   - Stub `next/navigation` and `next/headers` so server-side calls
 *     inside our actions work in unit tests
 */

import "@testing-library/jest-dom/vitest";
import { afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";

// --- env defaults ----------------------------------------------------
// These are dummy values; tests that need a real Supabase URL go through
// our `createMockSupabase()` factory and never make a network call.
process.env.NEXT_PUBLIC_SUPABASE_URL ??= "http://localhost:54321";
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??= "test-anon-key";
process.env.SUPABASE_SERVICE_ROLE_KEY ??= "test-service-role-key";
process.env.NEXT_PUBLIC_SITE_URL ??= "http://localhost:3000";
// NEXT_PUBLIC_BASE_URL removed — unified on NEXT_PUBLIC_SITE_URL
process.env.FROM_EMAIL ??= "test@brightblue.test";
process.env.SALES_TEAM_EMAIL ??= "sales@brightblue.test";
process.env.STUDIO_TEAM_EMAIL ??= "studio@brightblue.test";
process.env.CRON_SECRET ??= "test-cron-secret";
if (!process.env.NODE_ENV) {
  // NODE_ENV is readonly under @types/node v22+, so we assign through
  // bracket notation to keep the setup file compile-clean. The test
  // runner only ever reads this value, never mutates it again.
  (process.env as Record<string, string>).NODE_ENV = "test";
}

// --- next/navigation -------------------------------------------------
// Components that import these expect them to exist; we stub them with
// no-ops by default. Individual tests can override via `vi.mock()`.
vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  }),
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
}));

// --- next/headers ----------------------------------------------------
vi.mock("next/headers", () => ({
  headers: vi.fn(async () => new Headers()),
  cookies: vi.fn(async () => ({
    get: vi.fn(),
    set: vi.fn(),
    delete: vi.fn(),
    getAll: vi.fn(() => []),
  })),
}));

// --- next/cache ------------------------------------------------------
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
  unstable_cache: <T extends (...args: unknown[]) => unknown>(fn: T) => fn,
}));

// --- between-test cleanup -------------------------------------------
afterEach(() => {
  // Unmount any rendered React tree.
  cleanup();
  // Reset call history but not the mock implementations themselves.
  vi.clearAllMocks();
});
