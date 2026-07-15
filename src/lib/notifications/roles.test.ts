/**
 * Tests for the runtime internal-role list used by notification
 * resolvers (kept distinct from `@/lib/roles` to avoid pulling
 * server-only modules into the spine).
 */

import { describe, it, expect } from "vitest";
import { INTERNAL_ROLE_LIST, isInternal } from "./roles";

describe("INTERNAL_ROLE_LIST", () => {
  it("contains all five internal roles", () => {
    expect(INTERNAL_ROLE_LIST).toEqual([
      "events_lead",
      "creative_lead",
      "operations_lead",
      "qa_lead",
      "admin",
    ]);
  });

  it("does not contain customer roles", () => {
    expect(INTERNAL_ROLE_LIST).not.toContain("customer_user");
    expect(INTERNAL_ROLE_LIST).not.toContain("customer_admin");
  });
});

describe("isInternal", () => {
  it("returns true for internal roles", () => {
    expect(isInternal("admin")).toBe(true);
    expect(isInternal("events_lead")).toBe(true);
  });

  it("returns false for customer roles", () => {
    expect(isInternal("customer_admin")).toBe(false);
    expect(isInternal("customer_user")).toBe(false);
  });

  it("returns false for null / undefined / empty", () => {
    expect(isInternal(null)).toBe(false);
    expect(isInternal(undefined)).toBe(false);
    expect(isInternal("")).toBe(false);
  });

  it("returns false for unknown roles", () => {
    expect(isInternal("not-a-real-role")).toBe(false);
  });
});
