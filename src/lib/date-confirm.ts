/**
 * Spell an ISO date unambiguously for form confirmation lines.
 *
 * Native `<input type="date">` displays in the browser's locale — a US-locale
 * browser shows mm/dd/yyyy to a UK buyer, which is how events get booked a
 * month out. The wizards echo the parsed date back in words ("Fri 3 Oct
 * 2026") so whatever the picker shows, the buyer confirms the real date.
 */

/** "2026-10-03" → "Fri 3 Oct 2026". Empty/invalid input → null. */
export function spellDate(iso: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null;
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  // Reject impossible dates like 2026-02-31, which Date silently rolls over.
  if (date.getUTCMonth() !== m - 1 || date.getUTCDate() !== d) return null;
  return date
    .toLocaleDateString("en-GB", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
      timeZone: "UTC",
    })
    .replace(/,/g, "");
}

/** Both dates spelled as one range line, or just the start when no end. */
export function spellDateRange(startIso: string, endIso: string): string | null {
  const start = spellDate(startIso);
  if (!start) return null;
  const end = spellDate(endIso);
  if (!end || endIso === startIso) return start;
  return `${start} – ${end}`;
}
