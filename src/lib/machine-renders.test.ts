import { describe, expect, it } from "vitest";

import { machineRenderFor } from "./machine-renders";

describe("machineRenderFor", () => {
  it("resolves slugs to their render image", () => {
    expect(machineRenderFor("experience-portal-xl")).toBe(
      "/machine/placeholders/xl.png",
    );
    expect(machineRenderFor("experience-portal-compact")).toBe(
      "/machine/placeholders/compact.png",
    );
  });

  it("tolerates display names with spaces and casing", () => {
    expect(machineRenderFor("Experience Portal XL")).toBe(
      "/machine/placeholders/xl.png",
    );
    expect(machineRenderFor("Experience Portal")).toBe(
      "/machine/placeholders/portal.png",
    );
  });

  it("falls back to the standard portal render for unknown or missing types", () => {
    expect(machineRenderFor("Bright.Play")).toBe(
      "/machine/placeholders/portal.png",
    );
    expect(machineRenderFor(null)).toBe("/machine/placeholders/portal.png");
  });
});
