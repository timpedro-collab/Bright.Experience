/**
 * Tests for the client-logo lookup — the case-study card's branded fallback
 * depends on this resolving seeded client_name values to real logo assets.
 */

import { describe, it, expect } from "vitest";
import { logoForClient } from "./client-logos";

describe("logoForClient", () => {
  it("resolves a client name to its logo, case-insensitively", () => {
    expect(logoForClient("Storyblok")?.src).toBe("/logos/storyblok.svg");
    expect(logoForClient("adyen")?.src).toBe("/logos/adyen.svg");
  });

  it("resolves seeded case-study aliases (BIBA → full association name)", () => {
    expect(logoForClient("BIBA")?.src).toBe("/logos/biba.png");
  });

  it("returns undefined for unknown or missing clients", () => {
    expect(logoForClient("Unknown Brand Ltd")).toBeUndefined();
    expect(logoForClient(undefined)).toBeUndefined();
  });
});
