import { describe, expect, it } from "vitest";

import { spellDate, spellDateRange } from "./date-confirm";

describe("spellDate", () => {
  it("spells an ISO date in unambiguous en-GB words", () => {
    expect(spellDate("2026-10-03")).toBe("Sat 3 Oct 2026");
  });

  it("distinguishes day and month even when both are ≤ 12", () => {
    // The exact ambiguity the confirmation line exists for: 04/10 vs 10/04.
    expect(spellDate("2026-04-10")).toBe("Fri 10 Apr 2026");
    expect(spellDate("2026-10-04")).toBe("Sun 4 Oct 2026");
  });

  it("returns null for empty or malformed input", () => {
    expect(spellDate("")).toBeNull();
    expect(spellDate("10/04/2026")).toBeNull();
    expect(spellDate("2026-13-40")).toBeNull();
  });

  it("rejects impossible calendar dates instead of rolling them over", () => {
    expect(spellDate("2026-02-31")).toBeNull();
  });
});

describe("spellDateRange", () => {
  it("joins start and end into one range line", () => {
    expect(spellDateRange("2026-10-03", "2026-10-05")).toBe(
      "Sat 3 Oct 2026 – Mon 5 Oct 2026"
    );
  });

  it("returns just the start when the end is missing or the same day", () => {
    expect(spellDateRange("2026-10-03", "")).toBe("Sat 3 Oct 2026");
    expect(spellDateRange("2026-10-03", "2026-10-03")).toBe("Sat 3 Oct 2026");
  });

  it("returns null when the start is missing", () => {
    expect(spellDateRange("", "2026-10-05")).toBeNull();
  });
});
