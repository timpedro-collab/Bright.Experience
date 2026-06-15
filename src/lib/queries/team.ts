/** Team member queries — reads for event and account scopes. */
import { createClient } from "@/lib/supabase/server";
import type { EventTeamMember } from "@/types";

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
    .select("*, profiles(name, avatar_url)")
    .eq("event_id", eventId)
    .neq("status", "removed")
    .order("created_at");

  if (error || !data) return [];
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
    .select("*, profiles(name, avatar_url)")
    .in("event_id", ids)
    .order("created_at");

  if (error || !data) return [];
  return data.map(mapMember);
}
