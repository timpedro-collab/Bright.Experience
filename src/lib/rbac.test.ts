/**
 * Tests for the RBAC helpers. The async `requireRole` / `requirePermission`
 * pull the current user via `@/lib/auth`, so we stub that module per-test.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { isInternal, hasPermission, requireRole, requirePermission } from "./rbac";

vi.mock("@/lib/auth", () => ({
  getUser: vi.fn(),
}));

describe("isInternal", () => {
  it("returns true for internal roles", () => {
    expect(isInternal("events_lead")).toBe(true);
    expect(isInternal("admin")).toBe(true);
  });

  it("returns false for customer roles", () => {
    expect(isInternal("customer_admin")).toBe(false);
    expect(isInternal("customer_user")).toBe(false);
  });
});

describe("hasPermission", () => {
  it("grants events.read to everyone", () => {
    expect(hasPermission("customer_user", "events.read")).toBe(true);
    expect(hasPermission("admin", "events.read")).toBe(true);
  });

  it("restricts events.write to internal only", () => {
    expect(hasPermission("customer_admin", "events.write")).toBe(false);
    expect(hasPermission("events_lead", "events.write")).toBe(true);
  });

  it("restricts events.create to events_lead and admin", () => {
    expect(hasPermission("events_lead", "events.create")).toBe(true);
    expect(hasPermission("admin", "events.create")).toBe(true);
    expect(hasPermission("creative_lead", "events.create")).toBe(false);
    expect(hasPermission("customer_admin", "events.create")).toBe(false);
  });

  it("returns false for unknown permissions", () => {
    expect(hasPermission("admin", "nonexistent.permission")).toBe(false);
  });

  it("allows customer_admin to decide approvals", () => {
    expect(hasPermission("customer_admin", "approvals.decide")).toBe(true);
    expect(hasPermission("customer_user", "approvals.decide")).toBe(false);
  });
});

describe("requireRole", () => {
  beforeEach(() => vi.clearAllMocks());

  it("resolves when user has one of the required roles", async () => {
    const { getUser } = await import("@/lib/auth");
    vi.mocked(getUser).mockResolvedValue({
      id: "u1",
      name: "x",
      email: "x@x",
      role: "events_lead",
      hasCompletedOnboarding: true,
    });
    await expect(requireRole(["events_lead", "admin"])).resolves.toBeUndefined();
  });

  it("throws when user is null", async () => {
    const { getUser } = await import("@/lib/auth");
    vi.mocked(getUser).mockResolvedValue(null);
    await expect(requireRole(["admin"])).rejects.toThrow(/Forbidden/i);
  });

  it("throws when user has a non-matching role", async () => {
    const { getUser } = await import("@/lib/auth");
    vi.mocked(getUser).mockResolvedValue({
      id: "u1",
      name: "x",
      email: "x@x",
      role: "customer_user",
      hasCompletedOnboarding: true,
    });
    await expect(requireRole(["admin"])).rejects.toThrow(/Forbidden/i);
  });
});

describe("requirePermission", () => {
  beforeEach(() => vi.clearAllMocks());

  it("resolves when user has the permission", async () => {
    const { getUser } = await import("@/lib/auth");
    vi.mocked(getUser).mockResolvedValue({
      id: "u1",
      name: "x",
      email: "x@x",
      role: "admin",
      hasCompletedOnboarding: true,
    });
    await expect(requirePermission("events.create")).resolves.toBeUndefined();
  });

  it("throws when user lacks the permission", async () => {
    const { getUser } = await import("@/lib/auth");
    vi.mocked(getUser).mockResolvedValue({
      id: "u1",
      name: "x",
      email: "x@x",
      role: "customer_user",
      hasCompletedOnboarding: true,
    });
    await expect(requirePermission("events.create")).rejects.toThrow(/Forbidden/i);
  });

  it("throws when user is null", async () => {
    const { getUser } = await import("@/lib/auth");
    vi.mocked(getUser).mockResolvedValue(null);
    await expect(requirePermission("events.read")).rejects.toThrow(/Forbidden/i);
  });
});
