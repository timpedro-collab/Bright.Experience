import { describe, expect, it } from "vitest";

import { normaliseMetrics } from "./normalise";
import { campaignCredit, pickHeadlineStat } from "./reveal";

function metricsWith(overrides: Record<string, unknown>) {
  return normaliseMetrics(overrides);
}

describe("pickHeadlineStat", () => {
  it("leads with opted-in leads when the event captured any", () => {
    const stat = pickHeadlineStat(
      metricsWith({ totalLeads: 1877, totalPlays: 5120 }),
    );
    expect(stat).toEqual({
      value: "1,877",
      label: "opted-in leads",
      support: "from 5,120 plays",
    });
  });

  it("falls back to plays when no leads were captured", () => {
    const stat = pickHeadlineStat(
      metricsWith({ totalPlays: 900, mediaImpressions: 24000 }),
    );
    expect(stat?.label).toBe("plays");
    expect(stat?.value).toBe("900");
    expect(stat?.support).toContain("24,000");
  });

  it("falls back to footfall impressions as the last resort", () => {
    const stat = pickHeadlineStat(metricsWith({ mediaImpressions: 24000 }));
    expect(stat).toEqual({
      value: "24,000",
      label: "footfall impressions",
      support: null,
    });
  });

  it("returns null rather than revealing a zero when nothing was measured", () => {
    expect(pickHeadlineStat(metricsWith({}))).toBeNull();
  });
});

describe("campaignCredit", () => {
  it("credits the champion with their role and company", () => {
    expect(
      campaignCredit({
        contactName: "Sarah Whitmore",
        contactRole: "Marketing",
        companyName: "Acme",
      }),
    ).toBe("Campaign led by Sarah Whitmore, Marketing — Acme");
  });

  it("degrades gracefully when only a name is known", () => {
    expect(campaignCredit({ contactName: "Sarah Whitmore" })).toBe(
      "Campaign led by Sarah Whitmore",
    );
  });

  it("returns null rather than a generic credit when no name exists", () => {
    expect(campaignCredit({ contactRole: "Marketing" })).toBeNull();
    expect(campaignCredit({ contactName: "  " })).toBeNull();
  });
});
