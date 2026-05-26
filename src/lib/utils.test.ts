/**
 * Tests for the Tailwind class merger.
 *
 * `cn()` is a one-line wrapper but it's threaded through every
 * component in the codebase — worth pinning the contract.
 */

import { describe, it, expect } from "vitest";
import { cn } from "./utils";

describe("cn", () => {
  it("joins simple strings", () => {
    expect(cn("a", "b")).toBe("a b");
  });

  it("skips falsy values", () => {
    expect(cn("a", false, null, undefined, "b")).toBe("a b");
  });

  it("flattens arrays", () => {
    expect(cn(["a", "b"], "c")).toBe("a b c");
  });

  it("expands object syntax (true keys win)", () => {
    expect(cn({ a: true, b: false, c: true })).toBe("a c");
  });

  it("resolves conflicting Tailwind classes (last wins)", () => {
    expect(cn("p-2", "p-4")).toBe("p-4");
    expect(cn("text-red-500", "text-blue-500")).toBe("text-blue-500");
  });

  it("preserves non-conflicting classes", () => {
    expect(cn("p-2", "m-1")).toBe("p-2 m-1");
  });

  it("returns empty string for no args", () => {
    expect(cn()).toBe("");
  });
});
