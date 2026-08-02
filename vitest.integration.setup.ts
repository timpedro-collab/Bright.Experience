/**
 * Setup for the local-Postgres integration suite.
 *
 * Loads `.env.local` so the suite finds the CLI-printed local keys, then
 * replaces the two boundaries that assume a Next.js request:
 *   - `@/lib/supabase/server` → the persona client the test signed in as
 *   - `@/lib/observability/log-query-error` → a recorder the test asserts on
 *
 * Everything else runs for real against Postgres.
 */

import { readFileSync } from "node:fs";
import { vi } from "vitest";

// --- env -------------------------------------------------------------
// `npm run test:integration` exports the keys, but reading .env.local too means
// a bare `vitest --config vitest.integration.config.ts` also works.
try {
  const raw = readFileSync(new URL("./.env.local", import.meta.url), "utf8");
  for (const line of raw.split("\n")) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (match && !process.env[match[1]]) {
      process.env[match[1]] = match[2].replace(/^["']|["']$/g, "");
    }
  }
} catch {
  /* optional — CI exports the values instead */
}

process.env.NEXT_PUBLIC_SITE_URL ??= "http://localhost:3000";
process.env.FROM_EMAIL ??= "test@brightblue.test";
process.env.CRON_SECRET ??= "test-cron-secret";
// Mock mode would defeat the entire point of this suite.
delete process.env.NEXT_PUBLIC_MOCK_MODE;

// --- boundaries ------------------------------------------------------
vi.mock("@/lib/supabase/server", async () => {
  const { getActiveClient } = await import("@/test/integration/harness");
  return { createClient: async () => getActiveClient() };
});

vi.mock("@/lib/observability/log-query-error", async () => {
  const { recordQueryError } = await import("@/test/integration/harness");
  return {
    logQueryError: (
      operation: string,
      error: { message?: string } | Error | string | null | undefined,
      context: Record<string, unknown> = {}
    ) => {
      // Mirrors the real helper's early return: several call sites are
      // `if (error || !data)`, where a missing row is not a failure.
      if (!error) return;
      const message =
        typeof error === "string"
          ? error
          : (error as { message?: string })?.message ?? "unknown error";
      recordQueryError({ operation, message });
      console.error(`[integration] ${operation}: ${message}`, context);
    },
  };
});

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
  unstable_cache: <T extends (...args: unknown[]) => unknown>(fn: T) => fn,
}));

vi.mock("next/headers", () => ({
  headers: vi.fn(async () => new Headers()),
  cookies: vi.fn(async () => ({
    get: vi.fn(),
    set: vi.fn(),
    delete: vi.fn(),
    getAll: vi.fn(() => []),
  })),
}));
