import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

/**
 * Vitest configuration for Bright.Experience.
 *
 * We split tests into three modes:
 *   - `npm test`           → unit + integration (everything under `src/`)
 *   - `npm run test:rls`   → pgTAP SQL tests via Supabase CLI (separate runner)
 *   - `npm run test:e2e`   → Playwright (separate runner with its own config)
 *
 * happy-dom is chosen over jsdom for ~3x speed on our test sizes. Path
 * aliases mirror `tsconfig.json` so `@/foo` resolves identically.
 *
 * Coverage thresholds are enforced — falling below them fails CI. They
 * intentionally start strict on pure modules (`src/lib`) and relax on
 * server actions where a percentage of branches involve Supabase wiring
 * we mock at the boundary.
 */
export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      // `src/server/**` modules carry React's `server-only` marker, whose entry
      // point throws by design. Next resolves the `react-server` condition to
      // the package's no-op variant; the subpath isn't in the exports map, so
      // point at the file directly to get the same behaviour under Vitest.
      "server-only": fileURLToPath(
        new URL("./node_modules/server-only/empty.js", import.meta.url)
      ),
    },
  },
  test: {
    environment: "happy-dom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    exclude: [
      "node_modules",
      ".next",
      "supabase/migrations",
      "e2e/**",
      ".cursor/**",
      // Needs a live local Postgres — see vitest.integration.config.ts.
      "src/**/*.integration.test.ts",
    ],
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "json-summary"],
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "src/**/*.{test,spec}.{ts,tsx}",
        "src/test/**",
        "src/types/**",
        "src/**/*.d.ts",
        // Pure presentational components covered by E2E.
        "src/components/ui/**",
        // Mock data is just fixtures.
        "src/data/**",
      ],
      // Per-path thresholds. Below threshold = CI fails.
      //
      // These are ratchets, not targets. Until 2026-07-31 they held numbers
      // nobody had ever met (85 / 70 / 65) and CI ran `npm test` without the
      // coverage reporter, so nothing enforced them and the gap went unnoticed.
      // They now sit just under the real measured coverage: the suite fails the
      // moment a change makes coverage worse, and the numbers below get raised
      // as tests land. Never lower one to make a build pass — write the test.
      //
      // Measured 2026-07-31 (1830 tests):
      //   src/lib          lines 50.7  branches 43.0  functions 53.7  stmts 50.7
      //   src/app/actions  lines 42.1  branches 34.7  functions 36.4  stmts 40.2
      //   global           lines 31.0  branches 24.3  functions 24.8  stmts 30.3
      thresholds: {
        // Library code is mostly pure, so this is the tier to ratchet hardest.
        "src/lib/**/*.ts": {
          lines: 50,
          branches: 42,
          functions: 53,
          statements: 50,
        },
        // Server actions wrap Supabase + dispatch — branches we can hit
        // get covered, but Supabase chain coverage caps the ceiling.
        "src/app/actions/**/*.ts": {
          lines: 41,
          branches: 34,
          functions: 36,
          statements: 39,
        },
        // Overall floor. Low because it counts every React component,
        // including the many that are pure layout and covered only by E2E.
        global: {
          lines: 30,
          branches: 24,
          functions: 24,
          statements: 30,
        },
      },
    },
  },
});
