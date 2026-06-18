/** Resolve pre-fill slugs for the "Rebook this activation" CTA. */
import { getMachineSlugsByEvent } from "@/lib/queries/machine-instances";
import { getMachines } from "@/lib/queries/machines";

export interface RebookSlugs {
  machineSlug?: string;
  gameSlug?: string;
}

/**
 * Best-effort lookup of the catalog machine slug for an event so the booking
 * wizard can pre-fill. Prefers a deployed machine instance; falls back to
 * matching the legacy free-text `events.machine_type` label against the
 * catalog. Game slug is left undefined (no per-event game linkage today).
 */
export async function getRebookSlugsForEvent(
  eventId: string,
  machineType?: string,
): Promise<RebookSlugs> {
  const instanceSlugs = await getMachineSlugsByEvent(eventId);
  if (instanceSlugs[0]) return { machineSlug: instanceSlugs[0] };

  const label = (machineType ?? "").toLowerCase().trim();
  if (!label) return {};

  const machines = await getMachines();
  const match = machines.find((m) => {
    const slug = String(m.slug ?? "").toLowerCase();
    const name = String(m.name ?? "").toLowerCase();
    return (
      slug === label ||
      name === label ||
      (name && label.includes(name)) ||
      (name && name.includes(label))
    );
  });
  return match ? { machineSlug: String(match.slug) } : {};
}
