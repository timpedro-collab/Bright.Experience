/**
 * Minimal cached name lookups used by `generateMetadata` to build browser-tab
 * titles ("Live — Samsung Galaxy Launch"). Each helper selects only the name
 * column and is wrapped in React `cache` so a page and its metadata share one
 * query per request. RLS still applies; on any miss we return null and the
 * caller falls back to the plain section name.
 */
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

/** "Live — Samsung Galaxy Launch" when the name resolves, else just "Live". */
export function entityTitle(section: string, name: string | null): string {
  return name ? `${section} — ${name}` : section;
}

/** Event name by id, or null when missing/inaccessible. */
export const getEventNameForTitle = cache(
  async (id: string): Promise<string | null> => {
    const supabase = await createClient();
    const { data } = await supabase
      .from("events")
      .select("name")
      .eq("id", id)
      .maybeSingle();
    const name = (data as { name?: unknown } | null)?.name;
    return name ? String(name) : null;
  },
);

/** Venue name by slug, or null when missing/inaccessible. */
export const getVenueNameForTitle = cache(
  async (slug: string): Promise<string | null> => {
    const supabase = await createClient();
    const { data } = await supabase
      .from("venues")
      .select("name")
      .eq("slug", slug)
      .maybeSingle();
    const name = (data as { name?: unknown } | null)?.name;
    return name ? String(name) : null;
  },
);

/** Partner (or organizer — same table) name by slug, or null when missing. */
export const getPartnerNameForTitle = cache(
  async (slug: string): Promise<string | null> => {
    const supabase = await createClient();
    const { data } = await supabase
      .from("partners")
      .select("name")
      .eq("slug", slug)
      .maybeSingle();
    const name = (data as { name?: unknown } | null)?.name;
    return name ? String(name) : null;
  },
);
