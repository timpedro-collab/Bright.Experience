import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import {
  MAP_BOUNDS,
  PORTFOLIO_CITIES,
  projectToMapPercent,
} from "./portfolio-shows";

describe("PORTFOLIO_CITIES", () => {
  it("has unique keys and at least one named show per city", () => {
    const keys = PORTFOLIO_CITIES.map((c) => c.key);
    expect(new Set(keys).size).toBe(keys.length);
    for (const city of PORTFOLIO_CITIES) {
      expect(city.shows.length).toBeGreaterThan(0);
    }
  });

  it("marks exactly one city as the pilot, and it is Tampa", () => {
    const pilots = PORTFOLIO_CITIES.filter((c) => c.pilot);
    expect(pilots).toHaveLength(1);
    expect(pilots[0].city).toBe("Tampa");
  });

  it("keeps the labeled target list US and UK, with NRS Chicago on it", () => {
    const targets = PORTFOLIO_CITIES.filter((c) => !c.reach);
    expect(targets.map((c) => c.key).sort()).toEqual([
      "anaheim",
      "chicago",
      "detroit",
      "las-vegas",
      "london",
      "tampa",
    ]);
    const chicago = targets.find((c) => c.key === "chicago")!;
    expect(chicago.shows).toContain("National Restaurant Show");
    // The pilot is a target, never a faint reach dot.
    expect(PORTFOLIO_CITIES.find((c) => c.pilot)?.reach).toBeUndefined();
  });

  it("keeps every city inside the map's geographic crop", () => {
    for (const city of PORTFOLIO_CITIES) {
      expect(city.lat).toBeGreaterThan(MAP_BOUNDS.south);
      expect(city.lat).toBeLessThan(MAP_BOUNDS.north);
      expect(city.lng).toBeGreaterThan(MAP_BOUNDS.west);
      expect(city.lng).toBeLessThan(MAP_BOUNDS.east);
    }
  });
});

describe("projectToMapPercent", () => {
  it("projects every city to percentages inside the map", () => {
    for (const city of PORTFOLIO_CITIES) {
      const { leftPct, topPct } = projectToMapPercent(city.lat, city.lng);
      expect(leftPct).toBeGreaterThan(0);
      expect(leftPct).toBeLessThan(100);
      expect(topPct).toBeGreaterThan(0);
      expect(topPct).toBeLessThan(100);
    }
  });

  it("projects the bounds' corners to the map's corners", () => {
    expect(projectToMapPercent(MAP_BOUNDS.north, MAP_BOUNDS.west)).toEqual({
      leftPct: 0,
      topPct: 0,
    });
    expect(projectToMapPercent(MAP_BOUNDS.south, MAP_BOUNDS.east)).toEqual({
      leftPct: 100,
      topPct: 100,
    });
  });
});

describe("world-dots.svg", () => {
  it("matches the aspect ratio implied by MAP_BOUNDS, so markers land true", () => {
    const svg = readFileSync(
      resolve(__dirname, "../../../public/pitch/map/world-dots.svg"),
      "utf8",
    );
    const viewBox = svg.match(/viewBox="0 0 (\d+) (\d+)"/);
    expect(viewBox).not.toBeNull();
    const [, width, height] = viewBox!.map(Number) as unknown as [
      string,
      number,
      number,
    ];
    const expectedAspect =
      (MAP_BOUNDS.east - MAP_BOUNDS.west) / (MAP_BOUNDS.north - MAP_BOUNDS.south);
    expect(width / height).toBeCloseTo(expectedAspect, 1);
  });
});
