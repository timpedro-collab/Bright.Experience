"use server";

/**
 * Team member management actions — request, approve, reject, remove.
 *
 * Customers can request team members (status=pending). Internal users
 * can approve or reject. Both sides can remove approved members.
 */

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getUser, requireInternalUser } from "@/lib/auth";
import { dispatchNotification } from "@/lib/notifications/dispatch";
import { inviteCustomerUserSystem } from "@/app/actions/invites";
import type { ActionResult } from "@/types/actions";

/** Role label stored on an approval-routed request that should become an admin. */
const ADMIN_ROLE_LABEL = "Account Admin";

export type TeammateInviteOutcome =
  | { success: true; status: "invited" | "requested"; domain?: string }
  | { success: false; error: string };

/**
 * Lead-contact self-serve teammate invite.
 *
 * The client's lead contact (`customer_admin`) can directly invite colleagues
 * on their OWN email domain as standard members — they get an instant login.
 * Anything outside the domain, or an admin-level invite, is routed to
 * Bright.Blue for a quick approval (it never silently grants access).
 */
export async function inviteTeammate(
  email: string,
  asAdmin = false,
): Promise<TeammateInviteOutcome> {
  const user = await getUser();
  if (!user) return { success: false, error: "Not authenticated" };
  if (user.role !== "customer_admin") {
    return {
      success: false,
      error: "Only your account's lead contact can invite teammates.",
    };
  }
  if (!user.accountId) {
    return {
      success: false,
      error: "Your account isn't set up for invites yet — please contact Bright.Blue.",
    };
  }

  const target = email.trim().toLowerCase();
  const at = target.indexOf("@");
  if (at <= 0 || at === target.length - 1) {
    return { success: false, error: "Enter a valid email address." };
  }

  const adminDomain = user.email.split("@")[1]?.toLowerCase() ?? "";
  const targetDomain = target.slice(at + 1);
  const sameDomain = adminDomain.length > 0 && adminDomain === targetDomain;

  const supabase = await createClient();

  // Block duplicates: someone who already has a portal login.
  const { data: existingProfile } = await supabase
    .from("profiles")
    .select("id")
    .eq("email", target)
    .maybeSingle();
  if (existingProfile) {
    return { success: false, error: "That person already has a portal login." };
  }

  // Self-serve: same company domain + standard member → instant login.
  if (sameDomain && !asAdmin) {
    const result = await inviteCustomerUserSystem(
      target,
      user.accountId,
      "customer_user",
    );
    if (!result.success) {
      return { success: false, error: result.error ?? "Invite failed." };
    }
    revalidatePath("/settings/team");
    return { success: true, status: "invited", domain: adminDomain };
  }

  // Approval path: outside the domain, or an admin-level invite. Route it
  // through the account's most recent event so it lands in the existing
  // team-request review + notification pipeline that Bright.Blue actions.
  const { data: latestEvent } = await supabase
    .from("events")
    .select("id")
    .eq("account_id", user.accountId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!latestEvent) {
    return {
      success: false,
      error: "We couldn't route this for approval — please ask your Bright.Blue contact to add this person.",
    };
  }

  const requested = await requestTeamMember(
    latestEvent.id as string,
    target,
    asAdmin ? ADMIN_ROLE_LABEL : "Team Member",
  );
  if (!requested.success) return { success: false, error: requested.error };
  revalidatePath("/settings/team");
  return { success: true, status: "requested", domain: adminDomain };
}

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

/**
 * Internal-only: approve a pending team member request.
 *
 * Approval now actually provisions access — it sends the magic-link invite
 * and creates the profile (previously it only flipped a status flag, so the
 * person never got a login). The requested role label decides whether they
 * come in as a standard user or an account admin.
 */
export async function approveTeamMember(
  memberId: string,
): Promise<ActionResult> {
  const { supabase, profile } = await requireInternalUser();

  const { data: member } = await supabase
    .from("event_team_members")
    .select("id, email, role_label, status, event_id")
    .eq("id", memberId)
    .maybeSingle();
  if (!member) return { success: false, error: "Request not found" };
  if (member.status !== "pending") {
    return { success: false, error: "This request has already been handled" };
  }

  const { data: event } = await supabase
    .from("events")
    .select("account_id")
    .eq("id", member.event_id as string)
    .maybeSingle();
  if (!event?.account_id) {
    return { success: false, error: "Couldn't resolve the account for this request" };
  }

  const inviteRole =
    member.role_label === ADMIN_ROLE_LABEL ? "customer_admin" : "customer_user";
  const invite = await inviteCustomerUserSystem(
    member.email as string,
    event.account_id as string,
    inviteRole,
  );
  if (!invite.success) {
    return { success: false, error: invite.error ?? "Failed to send the invite" };
  }

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
  revalidatePath(`/events/${member.event_id as string}`);
  revalidatePath("/settings/team");
  return { success: true, data: undefined };
}

/** Internal-only: reject a pending team member request. */
export async function rejectTeamMember(
  memberId: string,
): Promise<ActionResult> {
  const { supabase } = await requireInternalUser();

  const { data: member, error } = await supabase
    .from("event_team_members")
    .update({
      status: "removed",
      updated_at: new Date().toISOString(),
    })
    .eq("id", memberId)
    .eq("status", "pending")
    .select("event_id")
    .maybeSingle();

  if (error) return { success: false, error: error.message };
  if (member?.event_id) revalidatePath(`/events/${member.event_id as string}`);
  revalidatePath("/settings/team");
  return { success: true, data: undefined };
}

/** Remove an existing team member (any authenticated user on the account). */
export async function removeTeamMember(
  memberId: string,
): Promise<ActionResult> {
  const user = await getUser();
  if (!user) return { success: false, error: "Not authenticated" };
  const supabase = await createClient();

  const { data: member, error } = await supabase
    .from("event_team_members")
    .update({
      status: "removed",
      updated_at: new Date().toISOString(),
    })
    .eq("id", memberId)
    .select("event_id")
    .maybeSingle();

  if (error) return { success: false, error: error.message };
  if (member?.event_id) revalidatePath(`/events/${member.event_id as string}`);
  revalidatePath("/settings/team");
  return { success: true, data: undefined };
}
