/**
 * Profile bootstrap + landing-page resolver.
 *
 * The DB trigger added in `20260403000011_profile_bootstrap.sql`
 * inserts a profiles row whenever Supabase Auth creates an
 * `auth.users` row. The application-layer helpers in this module
 * exist for two reasons:
 *
 *   1. Defence in depth — if the trigger ever silently drops a
 *      row (RLS misconfig, migration rollback, etc.) the callback
 *      still leaves the user with a usable profile.
 *   2. Persona routing — a brand-new partner_admin shouldn't land
 *      on `/`; they should land on their partner dashboard. Same
 *      for venue users.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { UserRole } from "@/types";
import { getPartnerForUser } from "@/lib/queries/partners";

interface AuthUserShape {
  id: string;
  email?: string | null;
  user_metadata?: Record<string, unknown> | null;
}

/**
 * Ensures a profiles row exists for the given auth user. Returns the
 * resolved role. If no row exists, creates one defaulting to
 * `customer_user`. Idempotent; safe to call on every sign-in.
 */
export async function ensureProfile(
  supabase: SupabaseClient,
  user: AuthUserShape
): Promise<{ role: UserRole; accountId: string | null }> {
  const { data: existing } = await supabase
    .from("profiles")
    .select("role, account_id")
    .eq("id", user.id)
    .maybeSingle();

  if (existing) {
    return {
      role: existing.role as UserRole,
      accountId: (existing.account_id as string | null) ?? null,
    };
  }

  const meta = user.user_metadata ?? {};
  const metaName =
    (meta.name as string | undefined) ??
    (meta.full_name as string | undefined) ??
    null;
  const fallbackName =
    metaName ?? (user.email ? user.email.split("@")[0] : "New user");

  const metaRole = (meta.role as UserRole | undefined) ?? "customer_user";
  const metaAccountId = (meta.account_id as string | undefined) ?? null;

  await supabase.from("profiles").insert({
    id: user.id,
    name: fallbackName,
    email: user.email ?? `${user.id}@unknown`,
    role: metaRole,
    account_id: metaAccountId,
    is_active: true,
  });

  return { role: metaRole, accountId: metaAccountId };
}

/**
 * Returns the landing path a freshly signed-in user should be sent
 * to. Customers land on the home dashboard (which is event-list-
 * scoped to their account by RLS), partners and venues land in
 * their portal, internal users land on the global home.
 */
export async function resolveLandingPath(
  supabase: SupabaseClient,
  role: UserRole,
  userId: string,
  fallback: string = "/"
): Promise<string> {
  // Partner / venue routing depends on which partner the user belongs to.
  if (role === "partner_member" || role === "partner_admin") {
    const partner = await getPartnerForUser(userId).catch(() => null);
    if (partner?.slug) {
      // Partners with `type === 'venue'` land on the venue dashboard.
      if (partner.type === "venue") return `/venues/${partner.slug}/dashboard`;
      return `/partners/${partner.slug}/dashboard`;
    }
  }

  // Customer users see the event list on `/` (RLS scopes it).
  if (role === "customer_user" || role === "customer_admin") {
    return fallback === "/login" ? "/" : fallback;
  }

  // Internal roles use the same landing as customers (the dashboard
  // adapts based on isInternalUser), but we never want to honour a
  // back-redirect to /login.
  return fallback === "/login" ? "/" : fallback;
}
