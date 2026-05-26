/**
 * Supabase auth callback.
 *
 * Runs on every magic-link / OAuth / email-confirmation redirect.
 * Three jobs in sequence:
 *   1. Exchange the `code` for a session.
 *   2. Bootstrap the user's `profiles` row (defence in depth — the
 *      DB trigger already does this, but the application code
 *      stays correct even if the trigger is ever rolled back).
 *   3. Redirect to the persona-appropriate landing surface (partner
 *      dashboard for partners, venue dashboard for venues, the
 *      caller-supplied `next` for everyone else).
 */

import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { ensureProfile, resolveLandingPath } from "@/lib/auth/bootstrap";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (!code) {
    return NextResponse.redirect(`${origin}/login`);
  }

  const supabase = await createClient();
  const { data: exchangeData, error } =
    await supabase.auth.exchangeCodeForSession(code);

  if (error || !exchangeData.user) {
    return NextResponse.redirect(`${origin}/login?error=callback`);
  }

  const { role } = await ensureProfile(supabase, exchangeData.user);
  const landing = await resolveLandingPath(
    supabase,
    role,
    exchangeData.user.id,
    next
  );

  return NextResponse.redirect(`${origin}${landing}`);
}
