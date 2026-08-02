"use server";

/**
 * Internal setup for show organizers.
 *
 * Everything an organizer needs before they can log in and be useful:
 * the organizer record itself, their people, which shows are theirs, and
 * which physical units are standing at those shows. Until these existed the
 * only way to onboard an organizer was to write rows by hand, so a pilot
 * needed an engineer with database access.
 *
 * All six actions are internal-admin only. The organizer's own writes (zone,
 * mission, sponsor slots) live in `./organizers.ts` and are authorized
 * against their partner instead.
 */

import { revalidatePath } from "next/cache";

import { requireInternalUser } from "@/lib/auth";
import { isAdminRole } from "@/lib/roles";
import {
  generatePartnerCode,
  nextAvailableSlug,
  slugifyPartnerName,
} from "@/lib/partner-identity";
import {
  assignMachineToShowSchema,
  createMachineInstanceSchema,
  createOrganizerPartnerSchema,
  inviteOrganizerUserSchema,
  linkShowToOrganizerSchema,
  releaseMachineFromShowSchema,
  unlinkShowFromOrganizerSchema,
  type OrganizerUserRole,
} from "@/lib/validations/organizer-admin";

/**
 * Every surface that changes when an organizer's setup changes.
 *
 * The organizer side is invalidated with layout scope because the pages that
 * care are nested under a dynamic slug (`/organizers/[slug]/shows/…`), and a
 * path-scoped call would only clear the bare `/organizers` segment.
 */
function revalidateOrganizer(partnerId?: string | null) {
  revalidatePath("/admin/organizers");
  if (partnerId) revalidatePath(`/admin/organizers/${partnerId}`);
  revalidatePath("/organizers", "layout");
}

/**
 * Guard shared by all setup actions. Returns the internal client so callers
 * write as the signed-in admin — `partners`, `events`, and `machine_instances`
 * all carry `is_internal_user()` write policies, so no service role is needed.
 */
async function requireSetupAdmin() {
  const { supabase, profile } = await requireInternalUser();
  if (!isAdminRole(profile.role)) return { error: "Forbidden: admin access only" as const };
  return { supabase };
}

/**
 * Create an organizer, active immediately.
 *
 * Unlike the public partner application (which lands as `pending` for review),
 * an organizer created here is one we've already agreed to work with — an
 * admin typing their name *is* the approval.
 */
export async function createOrganizerPartner(data: {
  name: string;
  contactName?: string;
  contactEmail?: string;
}) {
  const parsed = createOrganizerPartnerSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false as const, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const gate = await requireSetupAdmin();
  if ("error" in gate) return { success: false as const, error: gate.error };
  const { supabase } = gate;

  const base = slugifyPartnerName(parsed.data.name);
  if (!base) {
    return { success: false as const, error: "That name has no letters or numbers to build a web address from." };
  }

  // Slugs are unique across every partner type, so check the whole table, not
  // just organizers, before minting one.
  const { data: existing } = await supabase
    .from("partners")
    .select("slug")
    .like("slug", `${base}%`);
  const slug = nextAvailableSlug(
    base,
    ((existing ?? []) as { slug: string }[]).map((row) => row.slug)
  );

  const { data: partner, error } = await supabase
    .from("partners")
    .insert({
      name: parsed.data.name,
      slug,
      type: "organizer",
      contact_name: parsed.data.contactName?.trim() || null,
      contact_email: parsed.data.contactEmail?.trim() || null,
      partner_code: generatePartnerCode(parsed.data.name),
      status: "active",
      onboarded_at: new Date().toISOString(),
    })
    .select("id, slug")
    .single();

  if (error || !partner) {
    return { success: false as const, error: "Failed to create the organizer" };
  }

  revalidateOrganizer(partner.id);
  return { success: true as const, data: { id: partner.id, slug: partner.slug } };
}

/**
 * Invite one of the organizer's own people into their portal.
 *
 * Two rows have to line up for the portal to let them in: a `profiles` row
 * carrying a partner role, and a `partner_users` row tying them to this
 * organizer. `requireOrganizerContext` checks the second, so a missing
 * membership means a silent redirect home — both are written here together.
 */
export async function inviteOrganizerUser(
  partnerId: string,
  email: string,
  role: OrganizerUserRole
) {
  const parsed = inviteOrganizerUserSchema.safeParse({ partnerId, email, role });
  if (!parsed.success) {
    return { success: false as const, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const gate = await requireSetupAdmin();
  if ("error" in gate) return { success: false as const, error: gate.error };
  const { supabase } = gate;

  const { data: partner } = await supabase
    .from("partners")
    .select("id, type, name")
    .eq("id", partnerId)
    .maybeSingle();
  if (!partner || partner.type !== "organizer") {
    return { success: false as const, error: "That organizer doesn't exist" };
  }

  const normalisedEmail = parsed.data.email.toLowerCase();

  // Creating the auth user and writing a profile both need to bypass RLS.
  const { getServiceRoleClient } = await import("@/lib/supabase/service-role");
  const admin = getServiceRoleClient();

  // Someone already on the platform (an internal colleague, or a person who
  // works for two organizers) keeps their existing login; they only need the
  // membership row.
  const { data: existingProfile } = await admin
    .from("profiles")
    .select("id, role")
    .eq("email", normalisedEmail)
    .maybeSingle();

  let profileId = existingProfile?.id as string | undefined;

  if (!profileId) {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
    const { data: authData, error: authError } = await admin.auth.admin.inviteUserByEmail(
      normalisedEmail,
      {
        data: { partner_id: partnerId, role: parsed.data.role },
        redirectTo: `${siteUrl}/auth/callback?next=/auth/set-password`,
      }
    );
    if (authError) {
      return { success: false as const, error: authError.message };
    }
    profileId = authData?.user?.id as string | undefined;
    if (!profileId) {
      return { success: false as const, error: "Invitation sent but no user was created." };
    }

    const { error: profileError } = await admin.from("profiles").upsert(
      {
        id: profileId,
        email: normalisedEmail,
        name: normalisedEmail.split("@")[0],
        role: parsed.data.role,
        is_active: true,
      },
      { onConflict: "id" }
    );
    if (profileError) {
      console.error("[organizer-admin] profile upsert failed:", profileError.message);
      return { success: false as const, error: "Invitation sent but the profile wasn't created." };
    }
  }

  const { data: membership } = await supabase
    .from("partner_users")
    .select("id")
    .eq("partner_id", partnerId)
    .eq("profile_id", profileId)
    .maybeSingle();

  if (!membership) {
    const { error: membershipError } = await supabase.from("partner_users").insert({
      partner_id: partnerId,
      profile_id: profileId,
      // `partner_users.role` is the coarse membership grade; the fine-grained
      // permission comes from the profile role above.
      role: parsed.data.role === "partner_admin" ? "admin" : "member",
    });
    if (membershipError) {
      return { success: false as const, error: "Couldn't give them access to this organizer" };
    }
  }

  revalidateOrganizer(partnerId);
  return {
    success: true as const,
    data: { profileId, existingUser: Boolean(existingProfile) },
  };
}

/** Make a show one of this organizer's, so it appears in their portal. */
export async function linkShowToOrganizer(eventId: string, partnerId: string) {
  const parsed = linkShowToOrganizerSchema.safeParse({ eventId, partnerId });
  if (!parsed.success) {
    return { success: false as const, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const gate = await requireSetupAdmin();
  if ("error" in gate) return { success: false as const, error: gate.error };
  const { supabase } = gate;

  const { data: event } = await supabase
    .from("events")
    .select("id, organizer_partner_id")
    .eq("id", eventId)
    .maybeSingle();
  if (!event) return { success: false as const, error: "That show doesn't exist" };

  // Moving a show between organizers is a deliberate two-step: unlink there
  // first. Silently reassigning would pull sponsor inventory out from under
  // whoever was selling it.
  if (event.organizer_partner_id && event.organizer_partner_id !== partnerId) {
    return {
      success: false as const,
      error: "That show already belongs to another organizer. Unlink it there first.",
    };
  }

  const { error } = await supabase
    .from("events")
    .update({ organizer_partner_id: partnerId })
    .eq("id", eventId);

  if (error) return { success: false as const, error: "Failed to link the show" };

  revalidateOrganizer(partnerId);
  return { success: true as const, data: { id: eventId } };
}

/**
 * Take a show off an organizer. The show and everything on it survive — the
 * organizer simply stops being able to see it.
 */
export async function unlinkShowFromOrganizer(eventId: string) {
  const parsed = unlinkShowFromOrganizerSchema.safeParse({ eventId });
  if (!parsed.success) {
    return { success: false as const, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const gate = await requireSetupAdmin();
  if ("error" in gate) return { success: false as const, error: gate.error };
  const { supabase } = gate;

  const { data: event } = await supabase
    .from("events")
    .select("organizer_partner_id")
    .eq("id", eventId)
    .maybeSingle();

  const { error } = await supabase
    .from("events")
    .update({ organizer_partner_id: null })
    .eq("id", eventId);

  if (error) return { success: false as const, error: "Failed to unlink the show" };

  revalidateOrganizer(event?.organizer_partner_id as string | null);
  return { success: true as const, data: { id: eventId } };
}

/**
 * Register a physical unit in the hardware book, optionally deploying it to a
 * show in the same step (which is how it's used during setup).
 */
export async function createMachineInstance(data: {
  machineTypeId: string;
  serialNumber: string;
  nickname?: string;
  eventId?: string;
}) {
  const parsed = createMachineInstanceSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false as const, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const gate = await requireSetupAdmin();
  if ("error" in gate) return { success: false as const, error: gate.error };
  const { supabase } = gate;

  const serial = parsed.data.serialNumber.toUpperCase();

  // Checked here rather than relying on the unique index, so a duplicated
  // serial reads as "already registered" instead of a database error.
  const { data: clash } = await supabase
    .from("machine_instances")
    .select("id")
    .eq("serial_number", serial)
    .maybeSingle();
  if (clash) {
    return { success: false as const, error: `${serial} is already registered.` };
  }

  const { data: machine, error } = await supabase
    .from("machine_instances")
    .insert({
      machine_type_id: parsed.data.machineTypeId,
      serial_number: serial,
      nickname: parsed.data.nickname?.trim() || null,
      current_event_id: parsed.data.eventId ?? null,
      status: parsed.data.eventId ? "deployed" : "available",
    })
    .select("id")
    .single();

  if (error || !machine) {
    return { success: false as const, error: "Failed to register the machine" };
  }

  revalidateOrganizer();
  return { success: true as const, data: { id: machine.id, serialNumber: serial } };
}

/**
 * Stand an existing unit at a show.
 *
 * Only free units can be assigned: yanking one off another show would break
 * that show's fleet board and any sponsor slot sold against it, so the unit
 * has to be released there first.
 */
export async function assignMachineToShow(machineInstanceId: string, eventId: string) {
  const parsed = assignMachineToShowSchema.safeParse({ machineInstanceId, eventId });
  if (!parsed.success) {
    return { success: false as const, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const gate = await requireSetupAdmin();
  if ("error" in gate) return { success: false as const, error: gate.error };
  const { supabase } = gate;

  const { data: machine } = await supabase
    .from("machine_instances")
    .select("id, serial_number, current_event_id, status")
    .eq("id", machineInstanceId)
    .maybeSingle();
  if (!machine) return { success: false as const, error: "That machine doesn't exist" };

  if (machine.current_event_id && machine.current_event_id !== eventId) {
    return {
      success: false as const,
      error: `${machine.serial_number} is already at another show. Release it there first.`,
    };
  }
  if (machine.status === "retired") {
    return { success: false as const, error: `${machine.serial_number} is retired.` };
  }

  // A unit on the venue estate is earning against a placement where it stands.
  // Moving it onto a show floor would silently end that.
  const { data: placement } = await supabase
    .from("placements")
    .select("id")
    .eq("machine_instance_id", machineInstanceId)
    .in("status", ["active", "planned"])
    .maybeSingle();
  if (placement) {
    return {
      success: false as const,
      error: `${machine.serial_number} is sited at a venue. End that placement first.`,
    };
  }

  const { error } = await supabase
    .from("machine_instances")
    .update({ current_event_id: eventId, status: "deployed" })
    .eq("id", machineInstanceId);

  if (error) return { success: false as const, error: "Failed to assign the machine" };

  revalidateOrganizer();
  revalidatePath(`/events/${eventId}/configuration`);
  return { success: true as const, data: { id: machineInstanceId } };
}

/**
 * Take a unit off a show and clear its deployment, so its zone and job don't
 * follow it to the next one.
 *
 * Blocked while a sponsor slot points at it: the sponsor bought that unit at
 * that show, and a slot aimed at a machine that has left is worse than a
 * refused click.
 */
export async function releaseMachineFromShow(machineInstanceId: string) {
  const parsed = releaseMachineFromShowSchema.safeParse({ machineInstanceId });
  if (!parsed.success) {
    return { success: false as const, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const gate = await requireSetupAdmin();
  if ("error" in gate) return { success: false as const, error: gate.error };
  const { supabase } = gate;

  const { data: machine } = await supabase
    .from("machine_instances")
    .select("id, serial_number, current_event_id")
    .eq("id", machineInstanceId)
    .maybeSingle();
  if (!machine) return { success: false as const, error: "That machine doesn't exist" };
  if (!machine.current_event_id) {
    return { success: false as const, error: "That machine isn't at a show." };
  }

  const { data: slot } = await supabase
    .from("sponsorship_slots")
    .select("id, sponsor_name")
    .eq("event_id", machine.current_event_id)
    .eq("machine_instance_id", machineInstanceId)
    .maybeSingle();
  if (slot) {
    const who = slot.sponsor_name ? `${slot.sponsor_name}'s` : "an open";
    return {
      success: false as const,
      error: `${machine.serial_number} carries ${who} sponsor slot. Move or release that slot first.`,
    };
  }

  const { error } = await supabase
    .from("machine_instances")
    .update({
      current_event_id: null,
      status: "available",
      zone: null,
      mission: null,
    })
    .eq("id", machineInstanceId);

  if (error) return { success: false as const, error: "Failed to release the machine" };

  revalidateOrganizer();
  revalidatePath(`/events/${machine.current_event_id}/configuration`);
  return { success: true as const, data: { id: machineInstanceId } };
}
