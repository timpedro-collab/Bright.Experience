"use server";

/**
 * Issue and revoke token-gated public live-dashboard links on an event.
 *
 * Authorisation mirrors other sanctioned customer writes: the RLS-scoped client
 * must be able to read the event (internal staff or the owning account). The
 * token write itself uses the service role because customers cannot update
 * `events` rows directly.
 */
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getServiceRoleClient } from "@/lib/supabase/service-role";
import { logQueryError } from "@/lib/observability/log-query-error";

function clampDays(days: number): number {
  return Math.min(30, Math.max(1, days));
}

async function assertEventReachable(eventId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: "Not authenticated" };

  const { data: ev } = await supabase
    .from("events")
    .select("id, live_share_token")
    .eq("id", eventId)
    .maybeSingle();
  if (!ev) {
    return {
      ok: false as const,
      error: "You don't have access to this event.",
    };
  }
  return { ok: true as const, user, priorToken: ev.live_share_token as string | null };
}

/** Mint (or rotate) a live share link valid for `days` (1–30, default 7). */
export async function issueLiveShareLink(eventId: string, days = 7) {
  const gate = await assertEventReachable(eventId);
  if (!gate.ok) return { success: false as const, error: gate.error };

  const clamped = clampDays(days);
  const token = crypto.randomUUID();
  const expiresAt = new Date(
    Date.now() + clamped * 24 * 60 * 60 * 1000,
  ).toISOString();

  const admin = getServiceRoleClient();
  const { error } = await admin
    .from("events")
    .update({
      live_share_token: token,
      live_share_expires_at: expiresAt,
      updated_at: new Date().toISOString(),
    })
    .eq("id", eventId);

  if (error) {
    logQueryError("issueLiveShareLink", error, { eventId });
    return { success: false as const, error: "Failed to create share link" };
  }

  if (gate.priorToken) revalidatePath(`/live/${gate.priorToken}`);
  revalidatePath(`/live/${token}`);
  revalidatePath(`/events/${eventId}/stock`);
  return { success: true as const, data: { token, expiresAt } };
}

/** Revoke the event's live share link immediately. */
export async function revokeLiveShareLink(eventId: string) {
  const gate = await assertEventReachable(eventId);
  if (!gate.ok) return { success: false as const, error: gate.error };

  const admin = getServiceRoleClient();
  const { error } = await admin
    .from("events")
    .update({
      live_share_token: null,
      live_share_expires_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", eventId);

  if (error) {
    logQueryError("revokeLiveShareLink", error, { eventId });
    return { success: false as const, error: "Failed to revoke share link" };
  }

  if (gate.priorToken) revalidatePath(`/live/${gate.priorToken}`);
  revalidatePath(`/events/${eventId}/stock`);
  return { success: true as const, data: undefined };
}
