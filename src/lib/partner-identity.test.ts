/** Tests for partner slug and referral-code minting. */
import { describe, it, expect } from "vitest";

import {
  slugifyPartnerName,
  nextAvailableSlug,
  generatePartnerCode,
  MAX_SLUG_LENGTH,
} from "./partner-identity";

describe("slugifyPartnerName", () => {
  it("lowercases and hyphenates a company name", () => {
    expect(slugifyPartnerName("Informa Tech Shows")).toBe("informa-tech-shows");
  });

  it("collapses punctuation and runs of spaces into single hyphens", () => {
    expect(slugifyPartnerName("Smith & Co.  Events, Ltd")).toBe("smith-co-events-ltd");
  });

  it("keeps accented letters as their base letter", () => {
    expect(slugifyPartnerName("Präzision Events")).toBe("prazision-events");
  });

  it("trims leading and trailing separators", () => {
    expect(slugifyPartnerName("  -Reed Exhibitions-  ")).toBe("reed-exhibitions");
  });

  it("returns an empty string when nothing slug-able is left", () => {
    expect(slugifyPartnerName("!!!")).toBe("");
  });

  it("truncates a very long name without leaving a trailing hyphen", () => {
    const slug = slugifyPartnerName(`${"a".repeat(MAX_SLUG_LENGTH)} events`);
    expect(slug).toHaveLength(MAX_SLUG_LENGTH);
    expect(slug.endsWith("-")).toBe(false);
  });
});

describe("nextAvailableSlug", () => {
  it("returns the base slug when nobody has it", () => {
    expect(nextAvailableSlug("informa", ["reed", "clarion"])).toBe("informa");
  });

  it("suffixes the first free number when the base is taken", () => {
    expect(nextAvailableSlug("informa", ["informa"])).toBe("informa-2");
    expect(nextAvailableSlug("informa", ["informa", "informa-2"])).toBe("informa-3");
  });

  it("fills a gap in the series rather than always appending", () => {
    expect(nextAvailableSlug("informa", ["informa", "informa-3"])).toBe("informa-2");
  });

  it("compares case-insensitively, since slugs are lowercase by contract", () => {
    expect(nextAvailableSlug("informa", ["INFORMA"])).toBe("informa-2");
  });
});

describe("generatePartnerCode", () => {
  it("builds a readable head from the name plus a random tail", () => {
    expect(generatePartnerCode("Informa Tech Shows", () => "k3q")).toBe("BB-INFORMATK3Q");
  });

  it("uppercases the random tail", () => {
    expect(generatePartnerCode("Reed", () => "abc")).toBe("BB-REEDABC");
  });

  it("falls back to PARTNER when the name has no usable characters", () => {
    expect(generatePartnerCode("!!!", () => "xyz")).toBe("BB-PARTNERXYZ");
  });

  it("caps the readable head at eight characters", () => {
    expect(generatePartnerCode("Extraordinarily Long Name", () => "zz")).toBe(
      "BB-EXTRAORDZZ"
    );
  });

  it("produces different codes for the same name by default", () => {
    const codes = new Set(
      Array.from({ length: 20 }, () => generatePartnerCode("Informa"))
    );
    expect(codes.size).toBeGreaterThan(1);
  });
});
