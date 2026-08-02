/** Team member queries — reads for event and account scopes. */
import { createClient } from "@/lib/supabase/server";
import type { EventTeamMember } from "@/types";
import { logQueryError } from "@/lib/observability/log-query-error";

/**
 * `event_team_members` points at `profiles` three times (member, requester,
 * approver), so an unqualified `profiles(...)` embed is ambiguous and
 * PostgREST rejects the whole query (PGRST201). Name the member FK.
 */
const MEMBER_PROFILE =
  "profiles:event_team_members_profile_id_fkey (name, avatar_url)";

function mapMember(row: Record<string, unknown>): EventTeamMember {
  const profile = row.profiles as Record<string, unknown> | null;
  return {
    id: row.id as string,
    eventId: row.event_id as string,
    profileId: (row.profile_id as string) ?? undefined,
    email: row.email as string,
    roleLabel: row.role_label as string,
    status: row.status as EventTeamMember["status"],
    requestedBy: (row.requested_by as string) ?? undefined,
    approvedBy: (row.approved_by as string) ?? undefined,
    profile: profile
      ? {
          name: profile.name as string,
          avatarUrl: (profile.avatar_url as string) ?? undefined,
        }
      : undefined,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

/** All team members for a given event, with joined profile data. */
export async function getTeamForEvent(
  eventId: string,
): Promise<EventTeamMember[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("event_team_members")
    .select(`*, ${MEMBER_PROFILE}`)
    .eq("event_id", eventId)
    .neq("status", "removed")
    .order("created_at");

  if (error || !data) {
    logQueryError("getTeamForEvent", error, { eventId });
    return [];
  }
  return data.map(mapMember);
}

/** All team members across all events belonging to a given account. */
export async function getTeamForAccount(
  accountId: string,
): Promise<EventTeamMember[]> {
  const supabase = await createClient();

  const { data: eventIds } = await supabase
    .from("events")
    .select("id")
    .eq("account_id", accountId);
  if (!eventIds || eventIds.length === 0) return [];

  const ids = eventIds.map((e) => e.id as string);
  const { data, error } = await supabase
    .from("event_team_members")
    .select(`*, ${MEMBER_PROFILE}`)
    .in("event_id", ids)
    .order("created_at");

  if (error || !data) {
    logQueryError("getTeamForAccount", error, { accountId });
    return [];
  }
  return data.map(mapMember);
}

export interface AccountProfileRow {
  id: string;
  name: string | null;
  email: string;
  role: string;
  avatar_url: string | null;
}

/** Profiles belonging to an account (settings team roster). */
export async function getAccountProfiles(
  accountId: string,
): Promise<AccountProfileRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, name, email, role, avatar_url")
    .eq("account_id", accountId)
    .order("name");

  if (error || !data) {
    logQueryError("getAccountProfiles", error, { accountId });
    return [];
  }
  return data as AccountProfileRow[];
}
