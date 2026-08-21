/**
 * Venue snapshot content invariants: the non-financial posture holds (no
 * dollar figures, no splits), the photography is real and shipped, and
 * the story stays in four-point beats a slide can hold.
 */
import { describe, expect, it } from "vitest";

import {
  VENUE_BENEFITS,
  VENUE_COLLAGE,
  VENUE_COVER,
  VENUE_NEEDS,
  VENUE_WHAT,
} from "./content";

describe("venue snapshot content", () => {
  it("keeps each story slide to exactly four beats", () => {
    expect(VENUE_WHAT.points).toHaveLength(4);
    expect(VENUE_NEEDS.specs).toHaveLength(4);
    expect(VENUE_BENEFITS.points).toHaveLength(4);
  });

  it("uses unique ids within each slide's beats", () => {
    for (const items of [VENUE_WHAT.points, VENUE_NEEDS.specs, VENUE_BENEFITS.points]) {
      const ids = items.map((i) => i.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it("holds the non-financial posture: no dollar figures or splits anywhere", () => {
    const allCopy = JSON.stringify({
      VENUE_COVER,
      VENUE_WHAT,
      VENUE_NEEDS,
      VENUE_BENEFITS,
    });
    expect(allCopy).not.toMatch(/\$\d/);
    expect(allCopy).not.toMatch(/\d+\s*%/);
    expect(allCopy).not.toMatch(/revenue share/i);
  });

  it("makes the zero-cost promise explicitly on the needs slide", () => {
    const costSpec = VENUE_NEEDS.specs.find((s) => s.id === "cost");
    expect(costSpec?.line).toMatch(/sponsor-funded/i);
  });

  it("only references photography that ships in public/pitch/photos", () => {
    for (const photo of VENUE_COLLAGE.photos) {
      expect(photo.src).toMatch(/^\/pitch\/photos\/[a-z0-9-]+\.jpg$/);
      expect(photo.alt.length).toBeGreaterThan(10);
    }
  });

  it("ends with a contact action, not a price", () => {
    expect(VENUE_BENEFITS.contact.href).toMatch(/^mailto:/);
    expect(VENUE_BENEFITS.economicsNote).not.toMatch(/\$\d/);
  });
});
