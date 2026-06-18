/**
 * Machine-aware placement registry.
 *
 * Combines the calibrated placement geometry (from `placements.ts`) with a
 * per-variant backdrop to produce one `PlacementSlotDefinition` per
 * (machine variant × placement) — 27 slots in total. The geometry is shared
 * across variants today (all calibrated against the same square render); when
 * Theo delivers bespoke cabinet art he overrides `preview.screenImage` /
 * `preview.overlay` / `preview.viewport` per slot here, and every consumer
 * keeps working unchanged.
 */

import { PLACEMENT_PREVIEWS, type PlacementPreview } from "./placements";
import {
  DEFAULT_MACHINE_SLUG,
  MACHINE_VARIANTS,
  PLACEMENT_KEY_TO_ASSET_NAME,
  ASSET_NAME_TO_PLACEMENT_KEY,
  SLOT_LETTERS,
  buildPlaceholderLabel,
  type MachineSlug,
  type PlacementKey,
  type PlacementSlotDefinition,
  type SlotKey,
} from "./slot-registry";

const PLACEMENT_KEYS = Object.keys(SLOT_LETTERS) as PlacementKey[];

function buildRegistry(): Record<SlotKey, PlacementSlotDefinition> {
  const registry = {} as Record<SlotKey, PlacementSlotDefinition>;
  for (const variant of MACHINE_VARIANTS) {
    for (const placementKey of PLACEMENT_KEYS) {
      const assetName = PLACEMENT_KEY_TO_ASSET_NAME[placementKey];
      const base = PLACEMENT_PREVIEWS[assetName];
      if (!base) continue;
      const slotKey: SlotKey = `${variant.slug}/${placementKey}`;
      const slotLetter = SLOT_LETTERS[placementKey];
      // Variant backdrop swapped in; geometry reused until Theo recalibrates.
      const preview: PlacementPreview = {
        ...base,
        screenImage: variant.screenImage,
      };
      registry[slotKey] = {
        slotKey,
        machineSlug: variant.slug,
        machineLabel: variant.label,
        machineShortLabel: variant.shortLabel,
        placementKey,
        placementLabel: assetName,
        slotLetter,
        placeholderLabel: buildPlaceholderLabel(
          variant.shortLabel,
          slotLetter,
          assetName,
        ),
        assetName,
        preview,
      };
    }
  }
  return registry;
}

export const MACHINE_PLACEMENT_REGISTRY: Record<SlotKey, PlacementSlotDefinition> =
  buildRegistry();

/** All slot definitions (for the internal slot-map page). */
export const ALL_SLOTS: PlacementSlotDefinition[] = Object.values(
  MACHINE_PLACEMENT_REGISTRY,
);

/** Slots for one machine variant, ordered A→I. */
export function slotsForMachine(
  machineSlug: MachineSlug,
): PlacementSlotDefinition[] {
  return ALL_SLOTS.filter((s) => s.machineSlug === machineSlug).sort((a, b) =>
    a.slotLetter.localeCompare(b.slotLetter),
  );
}

/**
 * Resolve the catalog machine slug for an event.
 *
 * Preference order:
 *  1. A catalog slug from a deployed `machine_instance` (most accurate).
 *  2. A heuristic map from the legacy free-text `events.machine_type` label.
 *  3. The default variant.
 */
export function resolveMachineSlugForEvent(
  event: { machineType?: string | null } | null | undefined,
  opts?: { instanceMachineSlugs?: string[] },
): MachineSlug {
  const fromInstance = opts?.instanceMachineSlugs?.find((slug) =>
    MACHINE_VARIANTS.some((v) => v.slug === slug),
  );
  if (fromInstance) return fromInstance as MachineSlug;

  const label = (event?.machineType ?? "").toLowerCase();
  if (label) {
    if (label.includes("xl") || label.includes("play")) {
      return "experience-portal-xl";
    }
    if (label.includes("compact")) return "experience-portal-compact";
    if (label.includes("vend")) {
      // "Bright.Vend Pro" → standard portal; plain "Vend" → compact.
      return label.includes("pro")
        ? "experience-portal"
        : "experience-portal-compact";
    }
    if (label.includes("portal")) return "experience-portal";
  }
  return DEFAULT_MACHINE_SLUG;
}

/** Slot definition for an `assets.name` on a given machine variant. */
export function slotForAsset(
  assetName: string,
  machineSlug: MachineSlug = DEFAULT_MACHINE_SLUG,
): PlacementSlotDefinition | null {
  const placementKey = ASSET_NAME_TO_PLACEMENT_KEY[assetName];
  if (!placementKey) return null;
  return MACHINE_PLACEMENT_REGISTRY[`${machineSlug}/${placementKey}`] ?? null;
}

/**
 * Machine-aware drop-in replacement for `placementPreviewFor` — returns the
 * preview geometry/backdrop for an `assets.name` on the given machine variant.
 */
export function placementPreviewForMachine(
  assetName: string,
  machineSlug: MachineSlug = DEFAULT_MACHINE_SLUG,
): PlacementPreview | null {
  return slotForAsset(assetName, machineSlug)?.preview ?? null;
}
