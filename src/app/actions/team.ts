"use server";

/**
 * Team member management actions — request, approve, reject, remove.
 *
 * Customers can request team members (status=pending). Internal users
 * can approve or reject. Both sides can remove approved members.
 */

import { createClient } from "@/lib/supabase/server";
import { getUser, requireInternalUser } from "@/lib/auth";
import { dispatchNotification } from "@/lib/notifications/dispatch";
import type { ActionResult } from "@/types/actions";

/** Customer or internal user requests a new team member for an event. */
export async function requestTeamMember(
  eventId: string,
  email: string,
  roleLabel: string,
): Promise<ActionResult<{ id: string }>> {
  const user = await getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const trimmedEmail = email.trim().toLowerCase();
  if (!trimmedEmail) return { success: false, error: "Email is required" };

  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("event_team_members")
    .select("id, status")
    .eq("event_id", eventId)
    .eq("email", trimmedEmail)
    .neq("status", "removed")
    .maybeSingle();

  if (existing) {
    return { success: false, error: "This person is already on the team or has a pending request" };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("email", trimmedEmail)
    .maybeSingle();

  const { data, error } = await supabase
    .from("event_team_members")
    .insert({
      event_id: eventId,
      profile_id: profile?.id ?? null,
      email: trimmedEmail,
      role_label: roleLabel || "Team Member",
      status: "pending",
      requested_by: user.id,
    })
    .select("id")
    .single();

  if (error) return { success: false, error: error.message };

  // Notification for team member requests — uses the generic
  // "task.assigned" archetype as a proxy until a dedicated one is added.
  await dispatchNotification("task.assigned" as const, {
    eventId,
    actorId: user.id,
    entityType: "event_team_members",
    entityId: data.id,
    taskTitle: `Team member request: ${trimmedEmail} (${roleLabel || "Team Member"})`,
  }).catch(() => {});

  return { success: true, data: { id: data.id } };
}

/** Internal-only: approve a pending team member request. */
export async function approveTeamMember(
  memberId: string,
): Promise<ActionResult> {
  const { supabase, profile } = await requireInternalUser();

  const { error } = await supabase
    .from("event_team_members")
    .update({
      status: "approved",
      approved_by: profile.id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", memberId)
    .eq("status", "pending");

  if (error) return { success: false, error: error.message };
  return { success: true, data: undefined };
}

/** Internal-only: reject a pending team member request. */
export async function rejectTeamMember(
  memberId: string,
): Promise<ActionResult> {
  await requireInternalUser();
  const supabase = await createClient();

  const { error } = await supabase
    .from("event_team_members")
    .update({
      status: "removed",
      updated_at: new Date().toISOString(),
    })
    .eq("id", memberId)
    .eq("status", "pending");

  if (error) return { success: false, error: error.message };
  return { success: true, data: undefined };
}

/** Remove an existing team member (any authenticated user on the account). */
export async function removeTeamMember(
  memberId: string,
): Promise<ActionResult> {
  const user = await getUser();
  if (!user) return { success: false, error: "Not authenticated" };
  const supabase = await createClient();

  const { error } = await supabase
    .from("event_team_members")
    .update({
      status: "removed",
      updated_at: new Date().toISOString(),
    })
    .eq("id", memberId);

  if (error) return { success: false, error: error.message };
  return { success: true, data: undefined };
}
