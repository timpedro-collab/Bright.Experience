/**
 * Tests for publication-rights gating on public case study surfaces.
 */

import { describe, it, expect } from "vitest";
import { applyPublicationRights } from "./publication-rights";

const namedStudy = {
  slug: "storyblok-dmexco",
  client_name: "Storyblok",
  testimonial_author: "Ioana Grapa, Head of Global Events, Storyblok",
  publication_rights: "named" as const,
  anonymised_label: null,
};

const anonymisedStudy = {
  slug: "costa-coffee-catch-a-matcha",
  client_name: "Costa Coffee",
  testimonial_author: "Brand Experience Team, Costa Coffee",
  publication_rights: "anonymised" as const,
  anonymised_label: "A global coffee chain",
};

const aggregateStudy = {
  slug: "internal-only",
  client_name: "Secret Client",
  testimonial_author: "Someone",
  publication_rights: "aggregate_only" as const,
  anonymised_label: null,
};

describe("applyPublicationRights", () => {
  it("passes named studies through unchanged", () => {
    const [result] = applyPublicationRights([namedStudy]);
    expect(result).toEqual(namedStudy);
  });

  it("replaces client_name and clears testimonial_author for anonymised studies", () => {
    const [result] = applyPublicationRights([anonymisedStudy]);
    expect(result.client_name).toBe("A global coffee chain");
    expect(result.testimonial_author).toBeNull();
    expect(result.slug).toBe("costa-coffee-catch-a-matcha");
  });

  it("scrubs the client name from title and description for anonymised studies", () => {
    const [result] = applyPublicationRights([
      {
        ...anonymisedStudy,
        title: "Costa Coffee — Catch-A-Matcha",
        description:
          "COSTA COFFEE ran a matcha sampling tour across 10 UK city centres.",
      },
    ]);
    expect(result.title).toBe("A global coffee chain — Catch-A-Matcha");
    expect(result.description).toBe(
      "A global coffee chain ran a matcha sampling tour across 10 UK city centres."
    );
  });

  it("leaves title untouched for named studies", () => {
    const [result] = applyPublicationRights([
      { ...namedStudy, title: "Storyblok at DMEXCO" },
    ]);
    expect(result.title).toBe("Storyblok at DMEXCO");
  });

  it("falls back to a generic label when anonymised_label is missing", () => {
    const [result] = applyPublicationRights([
      { ...anonymisedStudy, anonymised_label: null },
    ]);
    expect(result.client_name).toBe("A leading brand");
    expect(result.testimonial_author).toBeNull();
  });

  it("excludes aggregate_only studies from public lists", () => {
    const results = applyPublicationRights([
      namedStudy,
      anonymisedStudy,
      aggregateStudy,
    ]);
    expect(results.map((r) => r.slug)).toEqual([
      "storyblok-dmexco",
      "costa-coffee-catch-a-matcha",
    ]);
  });

  it("defaults missing publication_rights to named", () => {
    const legacy = {
      slug: "legacy",
      client_name: "Legacy Co",
      testimonial_author: "Team",
    };
    const [result] = applyPublicationRights([legacy]);
    expect(result).toEqual(legacy);
  });

  it("withholds photography from anonymised studies", () => {
    const [result] = applyPublicationRights([
      {
        ...anonymisedStudy,
        hero_image_url: "/catalog/case-studies/costa-matcha/07-giant-cup.png",
        gallery_urls: ["/catalog/case-studies/costa-matcha/08-sign.png"],
      },
    ]);
    expect(result.hero_image_url).toBeNull();
    expect(result.gallery_urls).toEqual([]);
  });

  it("keeps photography on named studies", () => {
    const [result] = applyPublicationRights([
      { ...namedStudy, hero_image_url: "/hero.png", gallery_urls: ["/a.png"] },
    ]);
    expect(result.hero_image_url).toBe("/hero.png");
    expect(result.gallery_urls).toEqual(["/a.png"]);
  });

  it("scrubs the client name from details_json strings and drops the report link", () => {
    const [result] = applyPublicationRights([
      {
        ...anonymisedStudy,
        details_json: {
          reportUrl: "/resources/costa-case-study.html",
          insight: "Sited directly outside a Costa Coffee store in each city.",
          performance: [{ value: "3,270", label: "Costa Coffee samples" }],
        },
      },
    ]);
    const details = result.details_json as {
      reportUrl?: string;
      insight: string;
      performance: Array<{ label: string }>;
    };
    expect(details.reportUrl).toBeUndefined();
    expect(details.insight).toBe(
      "Sited directly outside a global coffee chain store in each city."
    );
    expect(details.performance[0].label).toBe("A global coffee chain samples");
  });

  it("scrubs the client name from the testimonial quote", () => {
    const [result] = applyPublicationRights([
      {
        ...anonymisedStudy,
        testimonial_quote: "Costa Coffee saw queues around the block.",
      },
    ]);
    expect(result.testimonial_quote).toBe(
      "A global coffee chain saw queues around the block."
    );
  });
});
