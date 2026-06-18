import { describe, it, expect } from "vitest";
import {
  ALL_SLOTS,
  MACHINE_PLACEMENT_REGISTRY,
  placementPreviewForMachine,
  resolveMachineSlugForEvent,
  slotForAsset,
  slotsForMachine,
} from "./machine-placements";
import { MACHINE_VARIANTS, SLOT_LETTERS } from "./slot-registry";

describe("machine placement registry", () => {
  it("has one slot per machine variant x placement (27 total)", () => {
    const placementCount = Object.keys(SLOT_LETTERS).length;
    expect(placementCount).toBe(9);
    expect(ALL_SLOTS.length).toBe(MACHINE_VARIANTS.length * placementCount);
    expect(ALL_SLOTS.length).toBe(27);
  });

  it("gives each variant a distinct backdrop image", () => {
    for (const variant of MACHINE_VARIANTS) {
      const slots = slotsForMachine(variant.slug);
      expect(slots.length).toBe(9);
      for (const slot of slots) {
        expect(slot.preview.screenImage).toBe(variant.screenImage);
      }
    }
  });

  it("orders a variant's slots A through I", () => {
    const letters = slotsForMachine("experience-portal").map((s) => s.slotLetter);
    expect(letters).toEqual(["A", "B", "C", "D", "E", "F", "G", "H", "I"]);
  });

  it("resolves a slot from an asset name + machine slug", () => {
    const slot = slotForAsset("Idle Screen Advert", "experience-portal-xl");
    expect(slot?.slotKey).toBe("experience-portal-xl/idle-advert");
    expect(slot?.slotLetter).toBe("A");
    expect(slot?.machineLabel).toBe("Experience Portal XL");
  });

  it("returns null for assets with no on-machine placement", () => {
    expect(slotForAsset("Brand Guidelines")).toBeNull();
  });

  it("placementPreviewForMachine matches the registry preview", () => {
    const preview = placementPreviewForMachine("Game Page Banner", "experience-portal-compact");
    expect(preview).toBe(
      MACHINE_PLACEMENT_REGISTRY["experience-portal-compact/game-banner"].preview,
    );
  });
});

describe("resolveMachineSlugForEvent", () => {
  it("prefers a valid deployed instance slug", () => {
    const slug = resolveMachineSlugForEvent(
      { machineType: "Bright.Vend Pro" },
      { instanceMachineSlugs: ["experience-portal-xl"] },
    );
    expect(slug).toBe("experience-portal-xl");
  });

  it("maps legacy Bright.Play to XL", () => {
    expect(resolveMachineSlugForEvent({ machineType: "Bright.Play" })).toBe(
      "experience-portal-xl",
    );
  });

  it("maps Bright.Vend Pro to the standard portal", () => {
    expect(resolveMachineSlugForEvent({ machineType: "Bright.Vend Pro" })).toBe(
      "experience-portal",
    );
  });

  it("maps a plain Vend to compact", () => {
    expect(resolveMachineSlugForEvent({ machineType: "Bright.Vend" })).toBe(
      "experience-portal-compact",
    );
  });

  it("falls back to the default for unknown labels", () => {
    expect(resolveMachineSlugForEvent({ machineType: "" })).toBe("experience-portal");
    expect(resolveMachineSlugForEvent(null)).toBe("experience-portal");
  });
});
