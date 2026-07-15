/** Behaviour tests for GBP money formatting. */
import { describe, expect, it } from "vitest";
import {
  formatGBP,
  formatMoneyFromPence,
  formatNumberUS,
  formatUSDFromCents,
} from "./currency";

describe("formatMoneyFromPence", () => {
  it("formats whole pounds without decimals by default", () => {
    expect(formatMoneyFromPence(123_456)).toBe("£1,235");
  });

  it("formats with pence when decimals is true", () => {
    expect(formatMoneyFromPence(123_456, { decimals: true })).toBe("£1,234.56");
  });

  it("treats nullish as zero", () => {
    expect(formatMoneyFromPence(0)).toBe("£0");
  });
});

describe("formatGBP", () => {
  it("formats whole-pound amounts", () => {
    expect(formatGBP(1234)).toBe("£1,234");
  });
});

describe("legacy aliases", () => {
  it("formatUSDFromCents matches formatMoneyFromPence", () => {
    expect(formatUSDFromCents(50_000)).toBe(formatMoneyFromPence(50_000));
  });
});

describe("formatNumberUS", () => {
  it("groups with en-GB separators", () => {
    expect(formatNumberUS(12345)).toBe("12,345");
  });
});
