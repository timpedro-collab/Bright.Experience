/**
 * Supabase auth callback.
 *
 * Runs on every magic-link / OAuth / email-confirmation / invite / recovery redirect.
 *
 * 1. Exchange the `code` for a session.
 * 2. Bootstrap the user's `profiles` row.
 * 3. Detect auth type (invite → set-password, recovery → reset-password).
 * 4. Redirect to the persona-appropriate landing surface.
 */

import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { ensureProfile, resolveLandingPath } from "@/lib/auth/bootstrap";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";
  const type = searchParams.get("type");

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

  if (type === "recovery") {
    return NextResponse.redirect(`${origin}/auth/reset-password`);
  }

  if (type === "invite" || next === "/auth/set-password") {
    return NextResponse.redirect(`${origin}/auth/set-password`);
  }

  const landing = await resolveLandingPath(
    supabase,
    role,
    exchangeData.user.id,
    next,
  );

  return NextResponse.redirect(`${origin}${landing}`);
}
