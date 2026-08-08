/** Applies publication rights to case studies for public marketing surfaces. */

export type PublicationRights = "named" | "anonymised" | "aggregate_only";

/** Case-insensitively replaces every occurrence of a client's name inside free text. */
function scrubClientName(
  text: string | null | undefined,
  clientName: string,
  label: string
): string | null {
  if (!text) return text ?? null;
  const escaped = clientName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return (
    text
      .replace(new RegExp(escaped, "gi"), label)
      // Labels usually begin with an article ("A global coffee chain"), so a
      // mid-sentence swap can produce "outside a A global…" — collapse the
      // doubled article, keeping the original sentence's own.
      .replace(/\b(a|an|the) (?:a|an|the)\b/gi, "$1")
  );
}

/** Recursively scrubs the client name from every string in a JSON blob. */
function scrubJson(value: unknown, clientName: string, label: string): unknown {
  if (typeof value === "string") return scrubClientName(value, clientName, label);
  if (Array.isArray(value)) return value.map((v) => scrubJson(v, clientName, label));
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        // A linked report artefact is fully client-branded — it cannot be
        // scrubbed, so it is dropped outright for anonymised studies.
        .filter(([key]) => key !== "reportUrl")
        .map(([key, v]) => [key, scrubJson(v, clientName, label)])
    );
  }
  return value;
}

/**
 * Applies publication rights to a case study for public rendering:
 * anonymised studies lose client attribution — the name is swapped for the
 * anonymised label everywhere it appears (client_name, title, description,
 * testimonial copy, and every string inside details_json), the testimonial
 * loses its author line, the branded report link is dropped, and photography
 * is withheld (event imagery identifies the client as surely as the logo
 * does). aggregate_only studies are excluded entirely.
 */
export function applyPublicationRights<
  T extends {
    publication_rights?: PublicationRights | string | null;
    anonymised_label?: string | null;
    client_name?: string | null;
    title?: string | null;
    description?: string | null;
    testimonial_quote?: string | null;
    testimonial_author?: string | null;
    hero_image_url?: string | null;
    gallery_urls?: string[] | null;
    details_json?: unknown;
  },
>(rows: T[]): T[] {
  return rows
    .filter((row) => (row.publication_rights ?? "named") !== "aggregate_only")
    .map((row) => {
      if ((row.publication_rights ?? "named") === "anonymised") {
        const label = row.anonymised_label ?? "A leading brand";
        const originalName = row.client_name;
        const scrub = (text: string | null | undefined) =>
          originalName ? scrubClientName(text, originalName, label) : (text ?? null);
        return {
          ...row,
          client_name: label,
          title: scrub(row.title),
          description: scrub(row.description),
          testimonial_quote: scrub(row.testimonial_quote),
          testimonial_author: null,
          ...("hero_image_url" in row ? { hero_image_url: null } : {}),
          ...("gallery_urls" in row ? { gallery_urls: [] } : {}),
          ...("details_json" in row && originalName
            ? { details_json: scrubJson(row.details_json, originalName, label) }
            : {}),
        };
      }
      return row;
    });
}
