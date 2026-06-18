/**
 * Tests for the capability catalogue and its helpers.
 *
 * The vocabulary is the public spine of the buying flow — any drift in
 * slugs or pre-selection rules silently breaks the proposal CTA URL
 * params, so coverage here is intentionally tight.
 */

import { describe, it, expect } from "vitest";
import {
  ALWAYS_ON,
  CAPABILITIES,
  UPSELL_SLUGS,
  getCapability,
  getCapabilities,
  sanitiseCapabilitySlugs,
  preSelectCapabilities,
  encodeCapabilityParam,
  decodeCapabilityParam,
} from "./capabilities";

describe("ALWAYS_ON", () => {
  it("contains exactly the five canonical always-on capabilities", () => {
    const slugs = ALWAYS_ON.map((c) => c.slug);
    expect(slugs).toEqual([
      "tap-to-play",
      "branded-wrap",
      "lead-capture",
      "engagement-dashboard",
      "turnkey",
    ]);
  });
});

describe("CAPABILITIES", () => {
  it("uses unique slugs", () => {
    const slugs = CAPABILITIES.map((c) => c.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("all entries are tailorable (always-on lives in ALWAYS_ON)", () => {
    expect(CAPABILITIES.every((c) => c.kind === "tailorable")).toBe(true);
  });

  it("UPSELL_SLUGS contains every capability slug", () => {
    for (const c of CAPABILITIES) {
      expect(UPSELL_SLUGS.has(c.slug)).toBe(true);
    }
  });
});

describe("getCapability", () => {
  it("returns the capability for a known slug", () => {
    expect(getCapability("live-telemetry")?.slug).toBe("live-telemetry");
  });

  it("returns null for unknown slugs", () => {
    expect(getCapability("totally-not-real")).toBeNull();
  });
});

describe("getCapabilities", () => {
  it("returns capabilities in catalogue order regardless of input order", () => {
    const out = getCapabilities(["age-verification", "live-telemetry"]);
    expect(out.map((c) => c.slug)).toEqual([
      "live-telemetry",
      "age-verification",
    ]);
  });

  it("silently drops unknown slugs", () => {
    const out = getCapabilities(["live-telemetry", "garbage"]);
    expect(out).toHaveLength(1);
  });

  it("dedupes input", () => {
    const out = getCapabilities(["live-telemetry", "live-telemetry"]);
    expect(out).toHaveLength(1);
  });
});

describe("sanitiseCapabilitySlugs", () => {
  it("returns an empty array for non-arrays", () => {
    expect(sanitiseCapabilitySlugs(undefined)).toEqual([]);
    expect(sanitiseCapabilitySlugs(null)).toEqual([]);
    expect(sanitiseCapabilitySlugs("string")).toEqual([]);
    expect(sanitiseCapabilitySlugs({ slug: "live-telemetry" })).toEqual([]);
  });

  it("strips non-string and unknown values", () => {
    expect(
      sanitiseCapabilitySlugs(["live-telemetry", 42, "garbage", null, "survey-layer"])
    ).toEqual(["live-telemetry", "survey-layer"]);
  });

  it("dedupes while preserving first-seen order", () => {
    expect(
      sanitiseCapabilitySlugs(["survey-layer", "live-telemetry", "survey-layer"])
    ).toEqual(["survey-layer", "live-telemetry"]);
  });
});

describe("preSelectCapabilities", () => {
  it("returns telemetry for a B2B trade show lead-gen quiz", () => {
    const slugs = preSelectCapabilities({
      objective: "lead-generation",
      eventType: "trade-show",
      audience: "B2B",
      industry: "technology",
    });
    expect(slugs).toContain("live-telemetry");
    // linkedin-follow, survey-layer, payments-onunit are opt-in only now —
    // never auto-promised on the match card.
    expect(slugs).not.toContain("linkedin-follow");
    expect(slugs).not.toContain("survey-layer");
    expect(slugs).not.toContain("payments-onunit");
  });

  it("returns sampling + dynamic-sponsors for a B2C festival", () => {
    const slugs = preSelectCapabilities({
      objective: "sampling",
      eventType: "festival",
      audience: "B2C",
    });
    expect(slugs).toContain("sampling-unlock");
    expect(slugs).toContain("dynamic-sponsors");
  });

  it("does not auto-select age-verification (opt-in only) for alcohol industry", () => {
    const slugs = preSelectCapabilities({ industry: "alcohol" });
    expect(slugs).not.toContain("age-verification");
  });

  it("caps at 5 results to keep the match card calm", () => {
    // Throw every signal we have at it
    const slugs = preSelectCapabilities({
      objective: "lead-generation",
      eventType: "trade-show",
      audience: "B2B",
      industry: "alcohol",
    });
    expect(slugs.length).toBeLessThanOrEqual(5);
  });

  it("returns an empty list for empty signals", () => {
    expect(preSelectCapabilities({})).toEqual([]);
  });

  it("survives a broken predicate without crashing", () => {
    // Pre-select code wraps in try/catch — feed it an extreme value and
    // confirm nothing throws.
    expect(() =>
      preSelectCapabilities({
        objective: "any" as unknown as string,
      })
    ).not.toThrow();
  });
});

describe("encodeCapabilityParam / decodeCapabilityParam", () => {
  it("encodes a clean list as comma-separated slugs", () => {
    expect(encodeCapabilityParam(["live-telemetry", "survey-layer"])).toBe(
      "live-telemetry,survey-layer"
    );
  });

  it("round-trips through encode + decode", () => {
    const slugs = ["live-telemetry", "survey-layer", "age-verification"];
    expect(decodeCapabilityParam(encodeCapabilityParam(slugs))).toEqual(slugs);
  });

  it("decodes null/empty to an empty array", () => {
    expect(decodeCapabilityParam(null)).toEqual([]);
    expect(decodeCapabilityParam(undefined)).toEqual([]);
    expect(decodeCapabilityParam("")).toEqual([]);
  });

  it("drops garbage during decode", () => {
    expect(decodeCapabilityParam("live-telemetry,garbage,survey-layer")).toEqual([
      "live-telemetry",
      "survey-layer",
    ]);
  });
});
