import { describe, it, expect } from "vitest";

import { caseStudyStats, toCaseStudyProof } from "./case-study-stats";

describe("caseStudyStats", () => {
  it("puts plays first and reach second", () => {
    const stats = caseStudyStats({
      consentRatePct: 100,
      marketingOptIns: 1980,
      brandImpressions: 200000,
      gamePlays: 3270,
    });

    expect(stats.map((s) => s.label)).toEqual([
      "game plays",
      "brand impressions",
      "opted-in leads",
    ]);
  });

  it("shortens large counts the way a slide would", () => {
    const [impressions] = caseStudyStats({ brandImpressions: 200000 });

    expect(impressions).toEqual({ value: "200k", label: "brand impressions" });
  });

  it("keeps smaller counts exact", () => {
    const [plays] = caseStudyStats({ gamePlays: 3270 });

    expect(plays.value).toBe("3,270");
  });

  it("renders a rate as a percentage", () => {
    const [consent] = caseStudyStats({ consentRatePct: 100 });

    expect(consent).toEqual({ value: "100%", label: "consent rate" });
  });

  it("drops keys it has no client-facing name for", () => {
    expect(caseStudyStats({ internalMargin: 42 })).toEqual([]);
  });

  it("ignores zeroes and non-numbers rather than printing them", () => {
    expect(caseStudyStats({ gamePlays: 0, marketingOptIns: "lots" })).toEqual([]);
  });

  it("honours the limit a strip has room for", () => {
    const stats = caseStudyStats(
      { gamePlays: 100, brandImpressions: 20000, marketingOptIns: 90 },
      2
    );

    expect(stats).toHaveLength(2);
  });

  it("survives a null or malformed column", () => {
    expect(caseStudyStats(null)).toEqual([]);
    expect(caseStudyStats([1, 2, 3])).toEqual([]);
    expect(caseStudyStats("nope")).toEqual([]);
  });
});

describe("toCaseStudyProof", () => {
  const ROWS = [
    {
      id: "1",
      title: "Costa Coffee",
      slug: "costa",
      client_name: "Costa",
      hero_image_url: "/a.png",
      stats_json: { gamePlays: 3270 },
    },
    {
      id: "2",
      title: "No numbers",
      slug: "none",
      client_name: null,
      hero_image_url: null,
      stats_json: {},
    },
    {
      id: "3",
      title: "Storyblok",
      slug: "storyblok",
      client_name: "Storyblok",
      hero_image_url: null,
      stats_json: { marketingOptIns: 685 },
    },
  ];

  it("keeps only studies with a hard number behind them", () => {
    const proof = toCaseStudyProof(ROWS);

    expect(proof.map((p) => p.slug)).toEqual(["costa", "storyblok"]);
  });

  it("caps the strip at the number of slots it has", () => {
    expect(toCaseStudyProof(ROWS, 1)).toHaveLength(1);
  });

  it("returns nothing when no study carries numbers", () => {
    expect(toCaseStudyProof([ROWS[1]])).toEqual([]);
  });
});
