/**
 * Snapshot deck content invariants: packages mirror the rate card, the
 * worked Pilot number matches the private calculator's math, and the
 * collage only references photos that ship in public/pitch/photos.
 */
import { describe, expect, it } from "vitest";

import { INFORMA_DEAL_CONFIG } from "@/lib/informa/deal";
import { formatRetailBand, PRODUCT_FAMILY } from "@/lib/informa/products";
import {
  compactBand,
  pilotSnapshot,
  SNAPSHOT_AD_DEMO,
  SNAPSHOT_COLLAGE,
  SNAPSHOT_PACKAGES,
  SNAPSHOT_VALUE,
  SNAPSHOT_WHAT,
} from "./snapshot-content";

describe("SNAPSHOT_PACKAGES", () => {
  it("carries only the resale line card, never organizer purchases", () => {
    const resale = PRODUCT_FAMILY.filter((p) => p.buyer !== "Organizer");
    expect(SNAPSHOT_PACKAGES).toHaveLength(resale.length);
    expect(SNAPSHOT_PACKAGES.some((p) => p.id === "rebooker")).toBe(false);
    for (const product of resale) {
      const tile = SNAPSHOT_PACKAGES.find((p) => p.id === product.id);
      expect(tile?.name).toBe(product.name);
      expect(tile?.band).toBe(formatRetailBand(product));
      expect(tile?.bandCompact).toBe(
        compactBand(product.retail.min, product.retail.max)
      );
      expect(tile?.bandUnit).toBe(product.retail.unit);
    }
  });

  it("labels who buys each resale line item", () => {
    const labels = SNAPSHOT_PACKAGES.map((p) => p.buyerLabel);
    expect(labels.filter((l) => l === "Sponsors buy")).toHaveLength(3);
    expect(labels.filter((l) => l === "Advertisers buy")).toHaveLength(1);
  });
});

describe("compactBand", () => {
  it("compacts a retail band to price-tag typography", () => {
    expect(compactBand(45_000, 60_000)).toBe("$45–60k");
    expect(compactBand(3_000, 8_000)).toBe("$3–8k");
  });
});

describe("SNAPSHOT_AD_DEMO", () => {
  it("shows a complete machine plus two event-safe ad-slot states", () => {
    expect(SNAPSHOT_AD_DEMO.completeMachine.src).toBe(
      "/pitch/machines/ad-slot-machine-complete.png"
    );
    expect(SNAPSHOT_AD_DEMO.completeMachine.alt).toMatch(/complete Bright\.Blue/i);
    expect(SNAPSHOT_AD_DEMO.machines).toHaveLength(2);
    for (const machine of SNAPSHOT_AD_DEMO.machines) {
      expect(machine.src).toMatch(/^\/pitch\/machines\/[a-z0-9-]+\.webp$/);
      expect(machine.alt).toMatch(/10-second/);
    }
  });
});

describe("pilotSnapshot", () => {
  it("derives the worked example from the pilot preset at suggested retail", () => {
    const snap = pilotSnapshot();
    // Pilot recipe: 2 shows, 12 machines (see INFORMA_PRESETS in deal.ts).
    expect(snap.shows).toBe(2);
    expect(snap.machines).toBe(12);
    // Sell side at suggested retail: 2×$60k arrival + 2×$50k floor +
    // 4×$50k booth + 16×$5k ad slots = $500k gross, 30% retained.
    expect(snap.gross).toBe(500_000);
    expect(snap.partnerShare).toBe(150_000);
    expect(snap.sharePercent).toBe("30%");
  });

  it("keeps the retained share consistent with the deal config split", () => {
    const snap = pilotSnapshot();
    expect(snap.partnerShare).toBe(
      Math.round(snap.gross * INFORMA_DEAL_CONFIG.split.partner)
    );
  });
});

describe("snapshot copy", () => {
  it("tells the what-this-is story in exactly four statements", () => {
    expect(SNAPSHOT_WHAT.points).toHaveLength(4);
    const ids = SNAPSHOT_WHAT.points.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("only references photography that ships in public/pitch/photos", () => {
    for (const photo of SNAPSHOT_COLLAGE.photos) {
      expect(photo.src).toMatch(/^\/pitch\/photos\/[a-z0-9-]+\.jpg$/);
      expect(photo.alt.length).toBeGreaterThan(10);
      expect(photo.caption).toContain("·");
    }
  });

  it("links deeper into the suite without exposing the private calculator", () => {
    const hrefs = SNAPSHOT_VALUE.links.map((l) => l.href);
    expect(hrefs).toContain("/informa");
    expect(hrefs).toContain("/informa/kit");
    expect(hrefs).toContain("/informa/report");
    expect(hrefs.some((h) => h.startsWith("/pp"))).toBe(false);
  });
});
