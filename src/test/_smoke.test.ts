/**
 * Tiny smoke test confirming Vitest, env vars, and TS path aliases
 * are all wired up correctly. Lives here so Phase 0 has at least one
 * passing test on day one — Phase 1 will replace this with the real
 * `dates.test.ts` for the full dates module.
 */

import { describe, it, expect } from "vitest";
import { cn } from "@/lib/utils";

describe("test infrastructure smoke", () => {
  it("imports through the @ alias", () => {
    expect(typeof cn).toBe("function");
  });

  it("merges class names", () => {
    expect(cn("a", "b")).toContain("a");
    expect(cn("a", "b")).toContain("b");
  });

  it("loads env vars from vitest.setup.ts", () => {
    expect(process.env.NEXT_PUBLIC_SUPABASE_URL).toBeDefined();
    expect(process.env.NEXT_PUBLIC_SITE_URL).toBeDefined();
  });
});
