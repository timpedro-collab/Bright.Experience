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
import {
  resolveCallbackOrigin,
  sanitiseNextPath,
} from "@/lib/auth/safe-redirect";

export async function GET(request: Request) {
  const { searchParams, origin: requestOrigin } = new URL(request.url);
  const code = searchParams.get("code");
  const type = searchParams.get("type");

  // Redirects are pinned to NEXT_PUBLIC_SITE_URL (request origin only in
  // dev/preview), and `next` is restricted to same-site relative paths —
  // closing the open-redirect seam flagged in STUBS-TO-REPLACE Phase 0.
  const origin = resolveCallbackOrigin(requestOrigin);
  const next = sanitiseNextPath(searchParams.get("next"));

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
