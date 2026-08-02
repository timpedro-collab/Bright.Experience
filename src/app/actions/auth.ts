/**
 * Authentication server actions.
 *
 * Login and password-reset run through these server actions (not the browser
 * client directly) so we have a server boundary to enforce rate limiting on.
 * Without this, the public login and reset endpoints could be hammered for
 * brute-force/abuse. Keyed by caller IP + email.
 */
"use server";

import { headers } from "next/headers";

import { createClient } from "@/lib/supabase/server";
import { resolveCallbackOrigin } from "@/lib/auth/safe-redirect";
import { authLimiter, getClientIp } from "@/lib/rate-limit";

type AuthResult = { success: true } | { success: false; error: string };

const RATE_LIMITED =
  "Too many attempts. Please wait a minute and try again.";

export async function signInWithPassword(
  email: string,
  password: string,
): Promise<AuthResult> {
  const ip = await getClientIp();
  if (!(await authLimiter(`${ip}:${email.toLowerCase()}`))) {
    return { success: false, error: RATE_LIMITED };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { success: false, error: error.message };
  return { success: true };
}

/**
 * Send a password-reset email.
 *
 * The reset link's origin is derived server-side. It used to be an argument, and
 * the caller passed `window.location.origin` — a value an attacker controls, so
 * a crafted request could point a genuine reset link at their own host and
 * collect the recovery token when the victim clicked it.
 */
export async function requestPasswordReset(email: string): Promise<AuthResult> {
  const ip = await getClientIp();
  if (!(await authLimiter(`${ip}:${email.toLowerCase()}`))) {
    return { success: false, error: RATE_LIMITED };
  }

  // resolveCallbackOrigin pins to NEXT_PUBLIC_SITE_URL when configured, and only
  // falls back to the request's own origin in dev/preview where it is not.
  const requestOrigin = (await headers()).get("origin") ?? "";
  const origin = resolveCallbackOrigin(requestOrigin);

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/reset-password`,
  });
  if (error) return { success: false, error: error.message };
  return { success: true };
}
