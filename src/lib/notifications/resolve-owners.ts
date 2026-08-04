/**
 * Owner resolution for the notification spine.
 *
 * Each archetype names an `ownerResolver` slug; this module turns that slug
 * + a context bag into a list of recipient profiles. The dispatcher calls
 * `resolveOwners(archetype, context)` and never sees the resolution logic —
 * which makes adding a new archetype a one-row change.
 *
 * Resolvers are intentionally tolerant: an event with no internal members
 * yet still resolves to the default Bright.Blue inbox via the
 * `DEFAULT_ACCOUNT_MANAGER` fallback so nothing is silently dropped during
 * early-stage events.
 */

import { createClient } from "@/lib/supabase/server";
import { DEFAULT_ACCOUNT_MANAGER } from "@/lib/team";
import { isInternal } from "./roles";
import type { Archetype } from "./archetypes";

/**
 * The dispatcher is shared between the cookie-bound client (used from
 * server actions) and the service-role client (used by the cron). Both
 * expose the same `from(...)` query surface so we type the parameter
 * loosely rather than pulling in two divergent client types.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type SupabaseLike = any;

async function client(supabase?: SupabaseLike): Promise<SupabaseLike> {
  return supabase ?? (await createClient());
}

/** The fields the dispatcher needs per recipient. */
export interface ResolvedRecipient {
  id: string;
  email: string;
  name: string;
  role: string;
  /** Marks the synthetic AE fallback so callers can route email-only sends. */
  isFallbackTeamInbox?: boolean;
}

/**
 * The context bag passed alongside every archetype. Every field is optional
 * because different archetypes need different anchors — `eventId` for
 * everything event-centric, `assetId` for asset archetypes, `quoteId` for
 * proposal archetypes, etc. The dispatcher validates the minimum on a
 * per-archetype basis.
 */
export interface DispatchContext {
  eventId?: string;
  assetId?: string;
  approvalId?: string;
  quoteId?: string;
  taskId?: string;
  messageId?: string;
  studioRequestId?: string;
  /** A sponsorship slot — the anchor for venue-operator routing. */
  slotId?: string;
  /** A deal registration — the anchor for registration-partner routing. */
  dealRegistrationId?: string;
  briefingFormType?: string;
  /** The acting user — used to suppress self-notifications. */
  actorId?: string;
  /** Extra template values (e.g. assetName, senderName). */
  [key: string]: string | number | boolean | null | undefined;
}

async function fetchProfile(
  userId: string,
  supabase?: SupabaseLike
): Promise<ResolvedRecipient | null> {
  const sb = await client(supabase);
  const { data } = await sb
    .from("profiles")
    .select("id, email, name, role")
    .eq("id", userId)
    .single();
  if (!data) return null;
  return {
    id: data.id,
    email: data.email,
    name: data.name,
    role: data.role,
  };
}

async function fetchEventAccount(
  eventId: string,
  supabase?: SupabaseLike
): Promise<{
  accountId: string | null;
  createdBy: string | null;
} | null> {
  const sb = await client(supabase);
  const { data } = await sb
    .from("events")
    .select("account_id, created_by")
    .eq("id", eventId)
    .single();
  if (!data) return null;
  return { accountId: data.account_id, createdBy: data.created_by };
}

async function fetchCustomerAdminsForAccount(
  accountId: string,
  supabase?: SupabaseLike
): Promise<ResolvedRecipient[]> {
  const supabase2 = await client(supabase);
  // Prefer customer_admins; fall back to any active customer profile so a
  // brand-new account whose first user is still `customer_user` still gets
  // the action.
  const { data: admins } = await supabase2
    .from("profiles")
    .select("id, email, name, role")
    .eq("account_id", accountId)
    .eq("role", "customer_admin")
    .eq("is_active", true);

  if (admins && admins.length > 0) return admins as ResolvedRecipient[];

  const { data: anyCustomer } = await supabase2
    .from("profiles")
    .select("id, email, name, role")
    .eq("account_id", accountId)
    .in("role", ["customer_admin", "customer_user"])
    .eq("is_active", true);

  return (anyCustomer ?? []) as ResolvedRecipient[];
}

async function fetchInternalsByRoles(
  roles: string[],
  supabase?: SupabaseLike
): Promise<ResolvedRecipient[]> {
  if (roles.length === 0) return [];
  const sb = await client(supabase);
  const { data } = await sb
    .from("profiles")
    .select("id, email, name, role")
    .in("role", roles)
    .eq("is_active", true);
  return (data ?? []) as ResolvedRecipient[];
}

/**
 * The organizer running a show: active users of the partner named on
 * `events.organizer_partner_id`.
 *
 * Organizers are partner-role users, so they sit outside both the internal
 * team and the buying account. Nothing resolved to them before, which is why
 * a sponsor enquiry on their own show had nowhere to land.
 */
async function fetchShowOrganizer(
  eventId: string,
  supabase?: SupabaseLike
): Promise<ResolvedRecipient[]> {
  const sb = await client(supabase);
  const { data: event } = await sb
    .from("events")
    .select("organizer_partner_id")
    .eq("id", eventId)
    .maybeSingle();
  if (!event?.organizer_partner_id) return [];

  const { data } = await sb
    .from("profiles")
    .select("id, email, name, role")
    .eq("partner_id", event.organizer_partner_id)
    .eq("is_active", true);
  return (data ?? []) as ResolvedRecipient[];
}

/**
 * The operator of a venue: active users of the partner that owns it. Resolved
 * from a sponsorship slot, since that is what an advertiser enquiry names.
 */
async function fetchVenueOperator(
  slotId: string,
  supabase?: SupabaseLike
): Promise<ResolvedRecipient[]> {
  const sb = await client(supabase);
  const { data: slot } = await sb
    .from("sponsorship_slots")
    .select("placements ( venues ( partner_id ) )")
    .eq("id", slotId)
    .maybeSingle();

  const placement = Array.isArray(slot?.placements)
    ? slot?.placements[0]
    : slot?.placements;
  const venue = Array.isArray(placement?.venues)
    ? placement?.venues[0]
    : placement?.venues;
  const partnerId = (venue as { partner_id?: string } | null)?.partner_id;
  if (!partnerId) return [];

  const { data } = await sb
    .from("profiles")
    .select("id, email, name, role")
    .eq("partner_id", partnerId)
    .eq("is_active", true);
  return (data ?? []) as ResolvedRecipient[];
}

/**
 * The named account-manager fallback. When no specific internal user is
 * found, the AE persona is used so the email at least lands in the right
 * inbox even if no profile is provisioned yet.
 */
function teamInboxFallback(role: string, email: string): ResolvedRecipient {
  return {
    id: "fallback-inbox",
    email,
    name: DEFAULT_ACCOUNT_MANAGER.fullName,
    role,
    isFallbackTeamInbox: true,
  };
}

export async function resolveOwners(
  archetype: Archetype,
  context: DispatchContext,
  supabase?: SupabaseLike
): Promise<ResolvedRecipient[]> {
  switch (archetype.ownerResolver) {
    case "customer_admins": {
      if (context.eventId) {
        const e = await fetchEventAccount(String(context.eventId), supabase);
        if (e?.accountId)
          return fetchCustomerAdminsForAccount(e.accountId, supabase);
      }
      if (context.accountId) {
        return fetchCustomerAdminsForAccount(
          String(context.accountId),
          supabase
        );
      }
      return [];
    }

    case "event_account_executive": {
      if (context.eventId) {
        const e = await fetchEventAccount(String(context.eventId), supabase);
        if (e?.createdBy) {
          const ae = await fetchProfile(e.createdBy, supabase);
          if (ae && isInternal(ae.role)) return [ae];
        }
      }
      const aes = await fetchInternalsByRoles(["events_lead"], supabase);
      if (aes.length > 0) return aes;
      return [
        teamInboxFallback("events_lead", DEFAULT_ACCOUNT_MANAGER.email),
      ];
    }

    case "event_creative_lead": {
      const creatives = await fetchInternalsByRoles(
        ["creative_lead", "events_lead"],
        supabase
      );
      if (creatives.length > 0) return creatives;
      return [
        teamInboxFallback(
          "creative_lead",
          process.env.STUDIO_TEAM_EMAIL ?? "studio@brightblue.co.uk"
        ),
      ];
    }

    case "event_operations_lead": {
      const ops = await fetchInternalsByRoles(["operations_lead"], supabase);
      if (ops.length > 0) return ops;
      return [];
    }

    case "event_members_internal": {
      return fetchInternalsByRoles(
        [
          "events_lead",
          "creative_lead",
          "operations_lead",
          "qa_lead",
          "admin",
        ],
        supabase
      );
    }

    case "event_members_all": {
      const internal = await fetchInternalsByRoles(
        ["events_lead", "creative_lead", "operations_lead", "qa_lead"],
        supabase
      );
      let customers: ResolvedRecipient[] = [];
      if (context.eventId) {
        const e = await fetchEventAccount(String(context.eventId), supabase);
        if (e?.accountId) {
          customers = await fetchCustomerAdminsForAccount(
            e.accountId,
            supabase
          );
        }
      }
      return [...internal, ...customers];
    }

    case "task_assignee": {
      if (!context.taskId) return [];
      const sb = await client(supabase);
      const { data: task } = await sb
        .from("tasks")
        .select("assigned_to")
        .eq("id", String(context.taskId))
        .single();
      if (!task?.assigned_to) return [];
      const profile = await fetchProfile(task.assigned_to, supabase);
      return profile ? [profile] : [];
    }

    case "message_recipients": {
      if (!context.eventId) return [];
      const e = await fetchEventAccount(String(context.eventId), supabase);
      if (!e?.accountId) return [];
      const [customers, internal] = await Promise.all([
        fetchCustomerAdminsForAccount(e.accountId, supabase),
        fetchInternalsByRoles(
          ["events_lead", "creative_lead", "operations_lead"],
          supabase
        ),
      ]);
      const all = [...customers, ...internal];
      return context.actorId
        ? all.filter((r) => r.id !== String(context.actorId))
        : all;
    }

    case "asset_uploader": {
      if (!context.assetId) return [];
      const sb = await client(supabase);
      const { data: asset } = await sb
        .from("assets")
        .select("uploaded_by")
        .eq("id", String(context.assetId))
        .single();
      if (!asset?.uploaded_by) return [];
      const profile = await fetchProfile(asset.uploaded_by, supabase);
      return profile ? [profile] : [];
    }

    case "asset_comment_participants": {
      if (!context.assetId || !context.eventId) return [];
      const sb = await client(supabase);
      const { data: commenters } = await sb
        .from("comments")
        .select("author_id")
        .eq("asset_id", String(context.assetId));
      const uniqueIds: string[] = Array.from(
        new Set((commenters ?? []).map((c: Record<string, unknown>) => String(c.author_id)))
      );
      const { data: assetRow } = await sb
        .from("assets")
        .select("uploaded_by")
        .eq("id", String(context.assetId))
        .single();
      if (assetRow?.uploaded_by && !uniqueIds.includes(assetRow.uploaded_by)) {
        uniqueIds.push(assetRow.uploaded_by);
      }
      const eventInfo = await fetchEventAccount(String(context.eventId), supabase);
      if (eventInfo?.createdBy && !uniqueIds.includes(eventInfo.createdBy)) {
        uniqueIds.push(eventInfo.createdBy);
      }
      const profiles: ResolvedRecipient[] = [];
      for (const uid of uniqueIds) {
        const p = await fetchProfile(uid, supabase);
        if (p) profiles.push(p);
      }
      if (profiles.length === 0) {
        return fetchInternalsByRoles(["creative_lead", "events_lead"], supabase);
      }
      return profiles;
    }

    case "show_organizer": {
      if (!context.eventId) return [];
      const organizer = await fetchShowOrganizer(
        String(context.eventId),
        supabase
      );
      // The show's internal owner too: a sponsor enquiry is commercial news,
      // and an organizer with no portal user yet must not mean silence.
      const internal = await fetchInternalsByRoles(
        ["events_lead", "admin"],
        supabase
      );
      const all = [...organizer, ...internal];
      if (all.length > 0) return all;
      return [
        teamInboxFallback("events_lead", DEFAULT_ACCOUNT_MANAGER.email),
      ];
    }

    case "venue_operator": {
      if (!context.slotId) return [];
      const operators = await fetchVenueOperator(
        String(context.slotId),
        supabase
      );
      if (operators.length > 0) return operators;
      // An unclaimed venue still has demand landing on it; route it to us.
      const internal = await fetchInternalsByRoles(
        ["events_lead", "admin"],
        supabase
      );
      if (internal.length > 0) return internal;
      return [
        teamInboxFallback("events_lead", DEFAULT_ACCOUNT_MANAGER.email),
      ];
    }

    case "registration_partner": {
      if (!context.dealRegistrationId) return [];
      const sb = await client(supabase);
      const { data: registration } = await sb
        .from("deal_registrations")
        .select("partner_id")
        .eq("id", String(context.dealRegistrationId))
        .maybeSingle();
      if (!registration?.partner_id) return [];

      const { data } = await sb
        .from("profiles")
        .select("id, email, name, role")
        .eq("partner_id", registration.partner_id)
        .eq("is_active", true);
      const partnerUsers = (data ?? []) as ResolvedRecipient[];
      if (partnerUsers.length > 0) return partnerUsers;
      // A registration verdict with no portal user to receive it goes to us,
      // so somebody can relay it rather than the decision evaporating.
      return fetchInternalsByRoles(["events_lead", "admin"], supabase);
    }

    case "internal_admins": {
      const admins = await fetchInternalsByRoles(["admin", "events_lead"], supabase);
      if (admins.length > 0) return admins;
      return [
        teamInboxFallback("admin", DEFAULT_ACCOUNT_MANAGER.email),
      ];
    }

    case "approval_requester": {
      if (!context.approvalId) return [];
      const sb = await client(supabase);
      const { data: approval } = await sb
        .from("approvals")
        .select("requested_by")
        .eq("id", String(context.approvalId))
        .single();
      if (!approval?.requested_by) return [];
      const profile = await fetchProfile(approval.requested_by, supabase);
      return profile ? [profile] : [];
    }

    default:
      return [];
  }
}
