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
  return text.replace(new RegExp(escaped, "gi"), label);
}

/**
 * Applies publication rights to a case study for public rendering:
 * anonymised studies lose client attribution — the name is swapped for the
 * anonymised label everywhere it appears (client_name, title, description),
 * and the testimonial loses its author line. aggregate_only studies are
 * excluded entirely. Campaign names and photography are NOT scrubbed; if
 * those identify the client, that is a per-study content decision.
 */
export function applyPublicationRights<
  T extends {
    publication_rights?: PublicationRights | string | null;
    anonymised_label?: string | null;
    client_name?: string | null;
    title?: string | null;
    description?: string | null;
    testimonial_author?: string | null;
  },
>(rows: T[]): T[] {
  return rows
    .filter((row) => (row.publication_rights ?? "named") !== "aggregate_only")
    .map((row) => {
      if ((row.publication_rights ?? "named") === "anonymised") {
        const label = row.anonymised_label ?? "A leading brand";
        const originalName = row.client_name;
        return {
          ...row,
          client_name: label,
          title: originalName
            ? scrubClientName(row.title, originalName, label)
            : (row.title ?? null),
          description: originalName
            ? scrubClientName(row.description, originalName, label)
            : (row.description ?? null),
          testimonial_author: null,
        };
      }
      return row;
    });
}
