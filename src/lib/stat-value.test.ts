/** Tests for parseStatValue — marketing stat string splitting. */
import { describe, it, expect } from "vitest";
import { parseStatValue } from "./stat-value";

describe("parseStatValue", () => {
  it('parses "92%"', () => {
    expect(parseStatValue("92%")).toEqual({ prefix: "", value: 92, suffix: "%" });
  });

  it('parses "Up to 40%"', () => {
    expect(parseStatValue("Up to 40%")).toEqual({
      prefix: "Up to ",
      value: 40,
      suffix: "%",
    });
  });

  it('parses "24hr"', () => {
    expect(parseStatValue("24hr")).toEqual({ prefix: "", value: 24, suffix: "hr" });
  });

  it('parses "200,000"', () => {
    expect(parseStatValue("200,000")).toEqual({
      prefix: "",
      value: 200000,
      suffix: "",
    });
  });

  it('parses "12"', () => {
    expect(parseStatValue("12")).toEqual({ prefix: "", value: 12, suffix: "" });
  });

  it('parses "3.5x"', () => {
    expect(parseStatValue("3.5x")).toEqual({ prefix: "", value: 3.5, suffix: "x" });
  });

  it('returns null for a no-number string ("GDPR")', () => {
    expect(parseStatValue("GDPR")).toBeNull();
  });

  it("returns null for empty string", () => {
    expect(parseStatValue("")).toBeNull();
  });
});
