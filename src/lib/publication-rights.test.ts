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
});
