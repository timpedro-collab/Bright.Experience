import { describe, it, expect } from "vitest";
import {
  ALL_SECTIONS,
  canViewSection,
  visibleSectionsForRole,
  type EventSection,
} from "./event-access";
import type { UserRole } from "@/types";

const FULL_ACCESS: UserRole[] = ["events_lead", "admin", "developer"];

describe("event-access matrix", () => {
  it("gives full-access roles every section", () => {
    for (const role of FULL_ACCESS) {
      expect(visibleSectionsForRole(role)).toEqual(ALL_SECTIONS);
    }
  });

  it("returns sections in canonical order", () => {
    const ops = visibleSectionsForRole("operations_lead");
    const sorted = [...ops].sort(
      (a, b) => ALL_SECTIONS.indexOf(a) - ALL_SECTIONS.indexOf(b),
    );
    expect(ops).toEqual(sorted);
  });

  describe("customer", () => {
    const visible: EventSection[] = [
      "overview",
      "briefing",
      "assets",
      "approvals",
      "actions",
      "deadlines",
      "communications",
      "live",
      "leads",
      "reports",
      "timeline",
      // Customers own tasks that live in these sections — prize/setup
      // confirmation (configuration) and onsite contact (logistics) — so the
      // pages must be reachable from those task CTAs.
      "configuration",
      "logistics",
    ];
    // Studio is split out below — it's lead-contact-only, so it can't live in
    // a set shared by both customer roles.
    const hidden: EventSection[] = [
      "compliance",
      "machine",
      "qa",
      "campaign",
      "activity",
    ];
    it.each(["customer_user", "customer_admin"] as UserRole[])(
      "%s sees their journey + a (customer-safe) timeline",
      (role) => {
        for (const s of visible) expect(canViewSection(role, s)).toBe(true);
        for (const s of hidden) expect(canViewSection(role, s)).toBe(false);
      },
    );

    it("reserves Bright.Studio self-ordering for the lead contact (customer_admin)", () => {
      expect(canViewSection("customer_admin", "studio")).toBe(true);
      expect(canViewSection("customer_user", "studio")).toBe(false);
    });
  });

  describe("operations_lead", () => {
    it("sees the physical-delivery lane only — logistics, config, machine, compliance, qa — never creative", () => {
      const role: UserRole = "operations_lead";
      for (const s of [
        "overview",
        "logistics",
        "configuration",
        "machine",
        "compliance",
        "qa",
      ] as EventSection[]) {
        expect(canViewSection(role, s)).toBe(true);
      }
      // No creative surfaces, and no event-day/portfolio surfaces ops
      // doesn't own.
      for (const s of [
        "briefing",
        "assets",
        "approvals",
        "studio",
        "live",
        "timeline",
        "communications",
        "leads",
        "reports",
        "campaign",
        "activity",
      ] as EventSection[]) {
        expect(canViewSection(role, s)).toBe(false);
      }
    });
  });

  describe("creative_lead", () => {
    it("sees assets, approvals, studio, configuration, briefing — not leads/reports/ops", () => {
      const role: UserRole = "creative_lead";
      for (const s of [
        "assets",
        "approvals",
        "studio",
        "configuration",
        "briefing",
      ] as EventSection[]) {
        expect(canViewSection(role, s)).toBe(true);
      }
      for (const s of [
        "leads",
        "reports",
        "live",
        "timeline",
        "logistics",
        "compliance",
        "machine",
        "qa",
        "campaign",
        "activity",
      ] as EventSection[]) {
        expect(canViewSection(role, s)).toBe(false);
      }
    });
  });

  describe("qa_lead", () => {
    it("sees qa, configuration, machine, live, timeline — not leads/reports/creative/logistics", () => {
      const role: UserRole = "qa_lead";
      for (const s of [
        "qa",
        "configuration",
        "machine",
        "live",
        "timeline",
      ] as EventSection[]) {
        expect(canViewSection(role, s)).toBe(true);
      }
      for (const s of [
        "leads",
        "reports",
        "briefing",
        "assets",
        "approvals",
        "studio",
        "logistics",
        "compliance",
        "campaign",
        "activity",
      ] as EventSection[]) {
        expect(canViewSection(role, s)).toBe(false);
      }
    });
  });

  it("the Ops example holds: operations_lead can't see leads or reports", () => {
    expect(canViewSection("operations_lead", "leads")).toBe(false);
    expect(canViewSection("operations_lead", "reports")).toBe(false);
  });
});
