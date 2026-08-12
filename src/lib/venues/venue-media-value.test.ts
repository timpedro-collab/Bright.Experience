import { describe, it, expect } from "vitest";
import { weeklyVenueMediaValueCents } from "./venue-media-value";

describe("weeklyVenueMediaValueCents", () => {
  it("returns null when no placement has footfall", () => {
    expect(
      weeklyVenueMediaValueCents(
        [{ footfallEstimate: null }, { footfallEstimate: 0 }],
        "tier_1",
      ),
    ).toBeNull();
  });

  it("returns null for an empty placement list", () => {
    expect(weeklyVenueMediaValueCents([], "tier_2")).toBeNull();
  });

  it("sums weekly media value across placements with footfall", () => {
    const total = weeklyVenueMediaValueCents(
      [{ footfallEstimate: 10_000 }, { footfallEstimate: 20_000 }],
      "tier_3",
    );
    // tier_3 CPM = 30; 10k → 63k impressions → 189_000¢; 20k → 126k → 378_000¢
    expect(total).toBe(567_000);
  });

  it("uses the venue tier CPM benchmark", () => {
    const tier1 = weeklyVenueMediaValueCents([{ footfallEstimate: 10_000 }], "tier_1");
    const tier3 = weeklyVenueMediaValueCents([{ footfallEstimate: 10_000 }], "tier_3");
    expect(tier1).toBeGreaterThan(tier3!);
  });
});
