/**
 * Tests for the role helper used as the first-line gate on every
 * "is this a Bright.Blue employee or a customer?" decision.
 */

import { describe, it, expect } from "vitest";
import {
  isInternalRole,
  isPartnerRole,
  isPartnerAdmin,
  canReviewCreativeAssets,
  canViewCreativeQueue,
  canRecordApprovalOnBehalf,
  canViewCommercial,
  canViewCreativeProduct,
  canViewLocations,
  canOrderStudioWork,
} from "./roles";
import type { UserRole } from "@/types";

describe("isInternalRole", () => {
  it.each([
    "events_lead",
    "creative_lead",
    "operations_lead",
    "qa_lead",
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

  it.each(["partner_member", "partner_admin"] as const)(
    "treats %s as external (not internal staff)",
    (role) => {
      expect(isInternalRole(role)).toBe(false);
    }
  );
});

describe("isPartnerRole", () => {
  it.each(["partner_member", "partner_admin"] as const)(
    "treats %s as a partner",
    (role) => {
      expect(isPartnerRole(role)).toBe(true);
    }
  );

  it.each(["admin", "events_lead", "customer_admin"] as const)(
    "does not treat %s as a partner",
    (role) => {
      expect(isPartnerRole(role)).toBe(false);
    }
  );

  it("only partner_admin is a partner admin", () => {
    expect(isPartnerAdmin("partner_admin")).toBe(true);
    expect(isPartnerAdmin("partner_member")).toBe(false);
    expect(isPartnerAdmin("admin")).toBe(false);
  });
});

describe("creative review ownership", () => {
  it("lets the Creative team (+ admin) action creative reviews", () => {
    for (const role of ["creative_lead", "admin"] as UserRole[]) {
      expect(canReviewCreativeAssets(role)).toBe(true);
    }
  });

  it("blocks Events Lead, Ops and QA from actioning creative reviews", () => {
    for (const role of [
      "events_lead",
      "operations_lead",
      "qa_lead",
      "customer_admin",
    ] as UserRole[]) {
      expect(canReviewCreativeAssets(role)).toBe(false);
    }
  });

  it("lets Events Lead view the creative queue read-only, but not Ops/QA", () => {
    expect(canViewCreativeQueue("events_lead")).toBe(true);
    expect(canViewCreativeQueue("creative_lead")).toBe(true);
    expect(canViewCreativeQueue("operations_lead")).toBe(false);
    expect(canViewCreativeQueue("qa_lead")).toBe(false);
  });
});

describe("approval sign-off on behalf", () => {
  it("allows customer-facing internal roles", () => {
    for (const role of [
      "events_lead",
      "creative_lead",
      "admin",
    ] as UserRole[]) {
      expect(canRecordApprovalOnBehalf(role)).toBe(true);
    }
  });

  it("blocks Ops and QA from recording customer sign-off", () => {
    expect(canRecordApprovalOnBehalf("operations_lead")).toBe(false);
    expect(canRecordApprovalOnBehalf("qa_lead")).toBe(false);
  });
});

describe("studio ordering", () => {
  it("lets internal staff and the client's lead contact order studio work", () => {
    for (const role of [
      "events_lead",
      "creative_lead",
      "operations_lead",
      "qa_lead",
      "admin",
      "customer_admin",
    ] as UserRole[]) {
      expect(canOrderStudioWork(role)).toBe(true);
    }
  });

  it("blocks junior customer users and partners from ordering studio work", () => {
    for (const role of [
      "customer_user",
      "partner_member",
      "partner_admin",
    ] as UserRole[]) {
      expect(canOrderStudioWork(role)).toBe(false);
    }
  });
});

describe("back-office ownership", () => {
  it("commercial surfaces are Events Lead + Admin only (not Ops/QA/Creative)", () => {
    for (const role of ["events_lead", "admin"] as UserRole[]) {
      expect(canViewCommercial(role)).toBe(true);
    }
    for (const role of [
      "operations_lead",
      "qa_lead",
      "creative_lead",
      "customer_admin",
    ] as UserRole[]) {
      expect(canViewCommercial(role)).toBe(false);
    }
  });

  it("creative/product surfaces are Creative + Events Lead + Admin (not Ops/QA)", () => {
    for (const role of [
      "creative_lead",
      "events_lead",
      "admin",
    ] as UserRole[]) {
      expect(canViewCreativeProduct(role)).toBe(true);
    }
    for (const role of ["operations_lead", "qa_lead", "customer_admin"] as UserRole[]) {
      expect(canViewCreativeProduct(role)).toBe(false);
    }
  });

  it("locations are Ops + Events Lead + Admin (not QA/Creative)", () => {
    for (const role of [
      "operations_lead",
      "events_lead",
      "admin",
    ] as UserRole[]) {
      expect(canViewLocations(role)).toBe(true);
    }
    for (const role of ["qa_lead", "creative_lead", "customer_admin"] as UserRole[]) {
      expect(canViewLocations(role)).toBe(false);
    }
  });
});
