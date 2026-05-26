/**
 * Tests for the role helper used as the first-line gate on every
 * "is this a Bright.Blue employee or a customer?" decision.
 */

import { describe, it, expect } from "vitest";
import { isInternalRole } from "./roles";

describe("isInternalRole", () => {
  it.each([
    "events_lead",
    "creative_lead",
    "operations_lead",
    "qa_lead",
    "developer",
    "admin",
  ] as const)("treats %s as internal", (role) => {
    expect(isInternalRole(role)).toBe(true);
  });

  it.each(["customer_user", "customer_admin"] as const)(
    "treats %s as external",
    (role) => {
      expect(isInternalRole(role)).toBe(false);
    }
  );
});
