import { describe, expect, it } from "vitest";

import { briefLines, briefSubject, buildBriefText } from "./brief";

describe("briefLines", () => {
  it("includes only answered fields, in delivery order", () => {
    const lines = briefLines({
      showName: "Connect Marketplace",
      sponsorCompany: "Duracell",
      objectives: ["Capture leads", "Sample product"],
      sponsorEmail: "",
    });
    expect(lines.map((l) => l.label)).toEqual(["Show", "Sponsor", "Objectives"]);
    expect(lines[2].value).toBe("Capture leads, Sample product");
  });

  it("trims whitespace-only answers away", () => {
    expect(briefLines({ showName: "   ", placement: " Registration " })).toEqual([
      { label: "Placement", value: "Registration" },
    ]);
  });
});

describe("buildBriefText", () => {
  it("returns null for an empty brief so the UI can stay disabled", () => {
    expect(buildBriefText({})).toBeNull();
    expect(buildBriefText({ showName: "  " })).toBeNull();
  });

  it("builds a labelled plain-text brief with the next-step footer", () => {
    const text = buildBriefText({
      showName: "Connect Marketplace",
      sponsorCompany: "Duracell",
      agreedPrice: "$40,000",
    });
    expect(text).toContain("Show: Connect Marketplace");
    expect(text).toContain("Sponsor: Duracell");
    expect(text).toContain("Agreed price: $40,000");
    expect(text).toContain("24 hours");
    expect(text).toContain("14 days of exclusivity");
  });
});

describe("briefSubject", () => {
  it("names the sponsor and show when both are known", () => {
    expect(
      briefSubject({ sponsorCompany: "Duracell", showName: "Connect Marketplace" })
    ).toBe("Deal brief: Duracell at Connect Marketplace");
  });

  it("falls back gracefully as fields go missing", () => {
    expect(briefSubject({ sponsorCompany: "Duracell" })).toBe("Deal brief: Duracell");
    expect(briefSubject({})).toBe("Deal brief from the Informa seller's kit");
  });
});
