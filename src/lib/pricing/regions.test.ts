/** Tests for price region resolution from country codes. */

import { describe, it, expect } from "vitest";
import { resolvePriceRegion, resolvePriceRegionOrDefault } from "./regions";

describe("resolvePriceRegion", () => {
  it("maps GB and UK to the uk region", () => {
    expect(resolvePriceRegion("GB")).toBe("uk");
    expect(resolvePriceRegion("UK")).toBe("uk");
    expect(resolvePriceRegion(" gb ")).toBe("uk");
  });

  it("maps US to the us region", () => {
    expect(resolvePriceRegion("US")).toBe("us");
  });

  it("maps EU and EEA countries to the eu region", () => {
    expect(resolvePriceRegion("DE")).toBe("eu");
    expect(resolvePriceRegion("FR")).toBe("eu");
    expect(resolvePriceRegion("CH")).toBe("eu");
    expect(resolvePriceRegion("NO")).toBe("eu");
  });

  it("returns null for countries with no published bands", () => {
    expect(resolvePriceRegion("AE")).toBeNull();
    expect(resolvePriceRegion("AU")).toBeNull();
  });

  it("returns null for missing or empty input", () => {
    expect(resolvePriceRegion(null)).toBeNull();
    expect(resolvePriceRegion(undefined)).toBeNull();
    expect(resolvePriceRegion("")).toBeNull();
  });
});

describe("resolvePriceRegionOrDefault", () => {
  it("defaults to uk when no published region exists", () => {
    expect(resolvePriceRegionOrDefault("AE")).toBe("uk");
  });

  it("returns the resolved region when one exists", () => {
    expect(resolvePriceRegionOrDefault("US")).toBe("us");
  });
});
