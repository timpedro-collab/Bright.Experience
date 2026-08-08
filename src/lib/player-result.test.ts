/** Tests for player result standing computation. */
import { describe, it, expect } from "vitest";
import { playerFirstName, standingFromScores } from "./player-result";

describe("standingFromScores", () => {
  it("ranks a top score as top 1%", () => {
    const scores = Array.from({ length: 100 }, (_, i) => i);
    const standing = standingFromScores(99, scores);
    expect(standing?.rank).toBe(1);
    expect(standing?.topPercent).toBe(1);
    expect(standing?.line).toBe("Top 1% of today's players");
  });

  it("shares rank between ties", () => {
    const standing = standingFromScores(50, [80, 50, 50, 20]);
    expect(standing?.rank).toBe(2);
    expect(standing?.of).toBe(4);
  });

  it("celebrates participation instead of printing a bottom-half percentile", () => {
    const standing = standingFromScores(10, [100, 90, 80, 10]);
    expect(standing?.line).toBe("One of 4 players today");
  });

  it("returns null when the score or the field is missing", () => {
    expect(standingFromScores(null, [1, 2])).toBeNull();
    expect(standingFromScores(50, [])).toBeNull();
  });
});

describe("playerFirstName", () => {
  it("takes the first name only", () => {
    expect(playerFirstName("Priya Shah")).toBe("Priya");
  });

  it("returns null for blank names", () => {
    expect(playerFirstName("  ")).toBeNull();
    expect(playerFirstName(null)).toBeNull();
  });
});
