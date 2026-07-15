/**
 * Recent command-palette destinations, persisted per browser in
 * localStorage. Powers the "Recent" group at the top of the palette so
 * repeat journeys (the same event, the same admin queue) are one
 * keystroke away.
 */

export interface PaletteRecent {
  href: string;
  label: string;
}

const STORAGE_KEY = "bright:palette-recents";
const MAX_RECENTS = 5;

/** Read the recents list (most recent first). Returns [] outside the browser. */
export function getPaletteRecents(): PaletteRecent[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (e): e is PaletteRecent =>
        typeof e === "object" &&
        e !== null &&
        typeof (e as PaletteRecent).href === "string" &&
        typeof (e as PaletteRecent).label === "string"
    );
  } catch {
    return [];
  }
}

/** Record a visited destination — dedupes by href, keeps the newest 5. */
export function pushPaletteRecent(entry: PaletteRecent): void {
  if (typeof window === "undefined") return;
  try {
    const next = [
      entry,
      ...getPaletteRecents().filter((e) => e.href !== entry.href),
    ].slice(0, MAX_RECENTS);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* storage full or blocked — recents are a nicety, never an error */
  }
}
