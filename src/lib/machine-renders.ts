/**
 * Machine-type → render image resolver, shared by the wrap preview, the
 * staged reveals and the booking confirmation so every surface shows the
 * same machine the customer actually booked.
 */

const RENDER_BY_TYPE: Record<string, string> = {
  "experience-portal-compact": "/machine/placeholders/compact.png",
  "experience-portal": "/machine/placeholders/portal.png",
  "experience-portal-xl": "/machine/placeholders/xl.png",
};

const DEFAULT_RENDER = "/machine/placeholders/portal.png";

/**
 * Render image path for a machine type. Tolerates display names
 * ("Experience Portal XL") as well as slugs ("experience-portal-xl");
 * unknown types fall back to the standard portal render.
 */
export function machineRenderFor(machineType?: string | null): string {
  if (!machineType) return DEFAULT_RENDER;
  const slug = machineType.trim().toLowerCase().replace(/[\s._]+/g, "-");
  return RENDER_BY_TYPE[slug] ?? DEFAULT_RENDER;
}
