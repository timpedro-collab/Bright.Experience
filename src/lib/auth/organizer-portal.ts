/**
 * Page-level resolution for the organizer portal.
 *
 * Every /organizers/:slug page needs the same three things: the signed-in
 * user, the partner that slug belongs to, and proof the user may see it.
 * This centralises that so a new page can't accidentally ship without the
 * ownership check.
 *
 * Internal staff pass for oversight, mirroring the venue and partner portals.
 */
import { redirect } from "next/navigation";

import { getUser } from "@/lib/auth";
import { getPartnerForUser } from "@/lib/queries/partners";
import { isInternalRole } from "@/lib/roles";
import { createClient } from "@/lib/supabase/server";
import type { User } from "@/types";

export interface OrganizerContext {
  user: User;
  partnerId: string;
  partnerName: string;
  slug: string;
}

/**
 * Resolve the organizer behind `slug`, or redirect away. Redirects rather
 * than throwing so a mistyped or foreign slug lands somewhere sensible
 * instead of showing an error page that confirms the slug exists.
 */
export async function requireOrganizerContext(slug: string): Promise<OrganizerContext> {
  const user = await getUser();
  if (!user) redirect("/login");

  const supabase = await createClient();
  const { data: partner } = await supabase
    .from("partners")
    .select("id, name, type, status")
    .eq("slug", slug)
    .maybeSingle();

  if (!partner || partner.type !== "organizer") redirect("/");

  if (!isInternalRole(user.role)) {
    const own = await getPartnerForUser(user.id);
    if (!own || own.id !== partner.id) redirect("/");
  }

  return {
    user,
    partnerId: String(partner.id),
    partnerName: String(partner.name),
    slug,
  };
}
