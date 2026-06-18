/**
 * Authentication server actions.
 *
 * Login and password-reset run through these server actions (not the browser
 * client directly) so we have a server boundary to enforce rate limiting on.
 * Without this, the public login and reset endpoints could be hammered for
 * brute-force/abuse. Keyed by caller IP + email.
 */
"use server";

import { createClient } from "@/lib/supabase/server";
import { authLimiter, getClientIp } from "@/lib/rate-limit";

type AuthResult = { success: true } | { success: false; error: string };

const RATE_LIMITED =
  "Too many attempts. Please wait a minute and try again.";

export async function signInWithPassword(
  email: string,
  password: string,
): Promise<AuthResult> {
  const ip = await getClientIp();
  if (!authLimiter(`${ip}:${email.toLowerCase()}`)) {
    return { success: false, error: RATE_LIMITED };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function requestPasswordReset(
  email: string,
  redirectTo: string,
): Promise<AuthResult> {
  const ip = await getClientIp();
  if (!authLimiter(`${ip}:${email.toLowerCase()}`)) {
    return { success: false, error: RATE_LIMITED };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo,
  });
  if (error) return { success: false, error: error.message };
  return { success: true };
}
