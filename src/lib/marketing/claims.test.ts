/**
 * Tests for the canonical marketing-claims module — guards the
 * sales-psychology invariants the homepage relies on.
 */

import { describe, it, expect } from "vitest";
import {
  HERO_STATS,
  TRUST_STATS,
  TRUST_CAPTION,
  TESTIMONIALS,
  SCARCITY_LINE,
  QUIZ_CTA,
} from "./claims";

describe("marketing claims", () => {
  it("leads the hero with the rebook rate (consensus proof first)", () => {
    expect(HERO_STATS[0].value).toBe("92%");
    expect(HERO_STATS[0].label).toMatch(/rebook/);
  });

  it("keeps every trust-band tile a hard number, not an adjective", () => {
    expect(TRUST_STATS).toHaveLength(3);
    expect(TRUST_STATS[1].value).toBe("Up to 40%");
    expect(TRUST_STATS[1].label).toMatch(/more leads captured/);
    for (const stat of TRUST_STATS) {
      expect(stat.value).toMatch(/\d/);
      expect(stat.label.length).toBeGreaterThan(0);
    }
  });

  it("keeps GDPR as a caption, never a stat tile", () => {
    expect(TRUST_CAPTION).toMatch(/GDPR/);
    for (const stat of TRUST_STATS) {
      expect(stat.value).not.toMatch(/GDPR/i);
      expect(stat.label).not.toMatch(/GDPR/i);
    }
  });

  it("provides two full attributed testimonials with logos that exist in the wall", () => {
    expect(TESTIMONIALS).toHaveLength(2);
    for (const t of TESTIMONIALS) {
      expect(t.author.length).toBeGreaterThan(0);
      expect(t.role.length).toBeGreaterThan(0);
      expect(t.company.length).toBeGreaterThan(0);
      expect(t.text.length).toBeGreaterThan(50);
      expect(t.logoSrc).toMatch(/^\/logos\//);
    }
  });

  it("frames scarcity honestly around physical inventory", () => {
    expect(SCARCITY_LINE).toMatch(/physical inventory/);
    expect(SCARCITY_LINE).toMatch(/book/);
  });

  it("gives the quiz CTA a cost-and-reward payoff", () => {
    expect(QUIZ_CTA.href).toBe("/quiz");
    expect(QUIZ_CTA.payoff).toMatch(/60 seconds/);
    expect(QUIZ_CTA.payoff).toMatch(/reach estimate/);
  });
});
