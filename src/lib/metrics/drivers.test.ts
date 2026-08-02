/** Tests for the demo-data drivers — snapshot stock derivation. */
import { describe, it, expect } from "vitest";
import { buildSnapshots } from "./drivers";

const BASE = {
  eventId: "evt-drivers-test",
  startDate: "2026-06-01",
  days: 3,
  machines: 2,
};

describe("buildSnapshots stock", () => {
  it("omits stock fields when no capacity is given", () => {
    const rows = buildSnapshots(BASE);
    expect(rows).toHaveLength(3);
    for (const row of rows) {
      expect(row.stock_capacity).toBeUndefined();
      expect(row.stock_remaining).toBeUndefined();
    }
  });

  it("depletes stock as cumulative prizes dispense, floored at zero", () => {
    const rows = buildSnapshots({ ...BASE, stockCapacity: 1000 });
    for (const row of rows) {
      expect(row.stock_capacity).toBe(1000);
      expect(row.stock_remaining).toBe(Math.max(0, 1000 - row.total_prizes));
      expect(row.stock_remaining).toBeGreaterThanOrEqual(0);
    }
    // Cumulative snapshots mean remaining only ever goes down.
    const remaining = rows.map((r) => r.stock_remaining!);
    expect([...remaining].sort((a, b) => b - a)).toEqual(remaining);
  });
});
