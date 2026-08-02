import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

/**
 * Integration test configuration — runs query code against local Postgres.
 *
 * Separate from `vitest.config.ts` because these tests need a live Supabase
 * (`npm run db:local`) and must never run inside the unit suite, which is
 * hermetic. `npm test` excludes `*.integration.test.ts`; `npm run
 * test:integration` runs only those.
 *
 * The point of this suite is the class of bug the mock Supabase client cannot
 * catch: a `select()` naming a column that doesn't exist, an embed PostgREST
 * can't resolve, an `on_conflict` with no matching index, an RPC that was never
 * migrated. Those all pass against a chainable test double and fail in
 * production. Here they fail in CI.
 */
export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      "server-only": fileURLToPath(
        new URL("./node_modules/server-only/empty.js", import.meta.url)
      ),
    },
  },
  test: {
    environment: "node",
    globals: true,
    setupFiles: ["./vitest.integration.setup.ts"],
    include: ["src/**/*.integration.test.ts"],
    // One database, shared fixtures: parallel files would race on writes.
    fileParallelism: false,
    testTimeout: 30_000,
    hookTimeout: 60_000,
  },
});
