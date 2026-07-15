/**
 * Tests for the legacy money formatter re-exported from the currency module.
 */

import { describe, it, expect } from "vitest";
import { formatGBP } from "./roi";

describe("formatGBP", () => {
  it("prefixes with £ and groups thousands", () => {
    expect(formatGBP(1234)).toBe("£1,234");
    expect(formatGBP(1_000_000)).toBe("£1,000,000");
  });

  it("rounds to a whole pound", () => {
    expect(formatGBP(1234.6)).toBe("£1,235");
    expect(formatGBP(1234.4)).toBe("£1,234");
  });

  it("returns £0 for zero", () => {
    expect(formatGBP(0)).toBe("£0");
  });
});
