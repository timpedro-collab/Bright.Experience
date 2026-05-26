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
      thresholds: {
        // Library code is mostly pure; demand high coverage.
        "src/lib/**/*.ts": {
          lines: 85,
          branches: 80,
          functions: 85,
          statements: 85,
        },
        // Server actions wrap Supabase + dispatch — branches we can hit
        // get covered, but Supabase chain coverage caps the ceiling.
        "src/app/actions/**/*.ts": {
          lines: 70,
          branches: 65,
          functions: 70,
          statements: 70,
        },
        // Overall sanity floor.
        global: {
          lines: 65,
          branches: 60,
          functions: 65,
          statements: 65,
        },
      },
    },
  },
});
