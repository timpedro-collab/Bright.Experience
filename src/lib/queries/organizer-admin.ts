/**
 * Reads behind the internal organizer setup console.
 *
 * These answer setup questions rather than delivery ones — "who are our
 * organizers", "what still isn't wired to anybody", "which units are free" —
 * so they deliberately look across partners, shows, and hardware at once.
 * Internal-only: every caller is gated by `canViewCommercial` above.
 */
import { createClient } from "@/lib/supabase/server";
import { logQueryError } from "@/lib/observability/log-query-error";

/** An organizer on the admin list, with enough to see if setup is finished. */
export interface OrganizerAdminRow {
  id: string;
  name: string;
  slug: string;
  status: string;
  contactName: string | null;
  contactEmail: string | null;
  createdAt: string | null;
  showCount: number;
  machineCount: number;
  teamCount: number;
}

/**
 * Every organizer partner with their show, hardware, and team counts.
 *
 * Four batched reads rather than three per organizer: the counts exist to
 * show at a glance which organizers are set up and which are still shells.
 */
export async function getOrganizerPartners(): Promise<OrganizerAdminRow[]> {
  const supabase = await createClient();

  const { data: partners, error } = await supabase
    .from("partners")
    .select("id, name, slug, status, contact_name, contact_email, created_at")
    .eq("type", "organizer")
    .order("name");

  if (error || !partners) return [];
  const partnerIds = (partners as Record<string, unknown>[]).map((p) => String(p.id));
  if (partnerIds.length === 0) return [];

  const [showsRes, teamRes] = await Promise.all([
    supabase.from("events").select("id, organizer_partner_id").in("organizer_partner_id", partnerIds),
    supabase.from("partner_users").select("partner_id").in("partner_id", partnerIds),
  ]);

  const shows = (showsRes.data ?? []) as Record<string, unknown>[];
  const showsByPartner = new Map<string, string[]>();
  for (const show of shows) {
    const key = String(show.organizer_partner_id);
    const bucket = showsByPartner.get(key);
    if (bucket) bucket.push(String(show.id));
    else showsByPartner.set(key, [String(show.id)]);
  }

  const machinesByShow = new Map<string, number>();
  if (shows.length > 0) {
    const { data: machines } = await supabase
      .from("machine_instances")
      .select("id, current_event_id")
      .in(
        "current_event_id",
        shows.map((s) => String(s.id))
      );
    for (const machine of (machines ?? []) as Record<string, unknown>[]) {
      const key = String(machine.current_event_id);
      machinesByShow.set(key, (machinesByShow.get(key) ?? 0) + 1);
    }
  }

  const teamByPartner = new Map<string, number>();
  for (const row of (teamRes.data ?? []) as Record<string, unknown>[]) {
    const key = String(row.partner_id);
    teamByPartner.set(key, (teamByPartner.get(key) ?? 0) + 1);
  }

  return (partners as Record<string, unknown>[]).map((p) => {
    const id = String(p.id);
    const showIds = showsByPartner.get(id) ?? [];
    return {
      id,
      name: String(p.name),
      slug: String(p.slug),
      status: String(p.status ?? "active"),
      contactName: p.contact_name ? String(p.contact_name) : null,
      contactEmail: p.contact_email ? String(p.contact_email) : null,
      createdAt: p.created_at ? String(p.created_at) : null,
      showCount: showIds.length,
      machineCount: showIds.reduce((total, showId) => total + (machinesByShow.get(showId) ?? 0), 0),
      teamCount: teamByPartner.get(id) ?? 0,
    };
  });
}

/** A person with access to an organizer's portal. */
export interface OrganizerTeamMember {
  profileId: string;
  email: string;
  name: string | null;
  /** Coarse membership grade on `partner_users`. */
  membershipRole: string;
  /** Platform role on the profile — what actually gates the portal. */
  profileRole: string | null;
  isActive: boolean;
}

/** One unit standing at a show, as the setup console needs it. */
export interface SetupMachine {
  id: string;
  serialNumber: string;
  nickname: string | null;
  zone: string | null;
  mission: string | null;
  status: string;
  machineTypeName: string | null;
  /** Set when a sponsor slot points at this unit, which blocks releasing it. */
  sponsorName: string | null;
  hasSlot: boolean;
}

/** A show under an organizer, with the fleet standing at it. */
export interface SetupShow {
  id: string;
  name: string;
  eventDateStart: string;
  eventDateEnd: string | null;
  venueName: string | null;
  currentStage: string;
  machines: SetupMachine[];
}

/** Everything the organizer detail page renders. */
export interface OrganizerSetup {
  id: string;
  name: string;
  slug: string;
  status: string;
  contactName: string | null;
  contactEmail: string | null;
  partnerCode: string | null;
  team: OrganizerTeamMember[];
  shows: SetupShow[];
}

/**
 * The full setup picture for one organizer.
 *
 * Returns null for a partner that isn't an organizer, so the page 404s rather
 * than rendering organizer tooling around a venue or reseller.
 */
export async function getOrganizerSetup(partnerId: string): Promise<OrganizerSetup | null> {
  const supabase = await createClient();

  const { data: partner } = await supabase
    .from("partners")
    .select("id, name, slug, type, status, contact_name, contact_email, partner_code")
    .eq("id", partnerId)
    .maybeSingle();
  if (!partner || (partner as Record<string, unknown>).type !== "organizer") return null;

  const [teamRes, showsRes] = await Promise.all([
    supabase
      .from("partner_users")
      .select("role, profile_id, profiles ( id, email, name, role, is_active )")
      .eq("partner_id", partnerId),
    supabase
      .from("events")
      .select(
        `id, name, event_date_start, event_date_end, venue_name, current_stage,
         machine_instances ( id, serial_number, nickname, zone, mission, status,
                             machines ( name ) )`
      )
      .eq("organizer_partner_id", partnerId)
      .order("event_date_start", { ascending: false }),
  ]);

  const showRows = (showsRes.data ?? []) as Record<string, unknown>[];

  // One read for every sponsor slot across the organizer's shows: a unit that
  // has been sold can't be released, and the console has to say why.
  const sponsorByMachine = new Map<string, string | null>();
  if (showRows.length > 0) {
    const { data: slots } = await supabase
      .from("sponsorship_slots")
      .select("machine_instance_id, sponsor_name")
      .in(
        "event_id",
        showRows.map((s) => String(s.id))
      );
    for (const slot of (slots ?? []) as Record<string, unknown>[]) {
      if (!slot.machine_instance_id) continue;
      sponsorByMachine.set(
        String(slot.machine_instance_id),
        slot.sponsor_name ? String(slot.sponsor_name) : null
      );
    }
  }

  const team: OrganizerTeamMember[] = ((teamRes.data ?? []) as Record<string, unknown>[]).map(
    (row) => {
      const profile = firstRelated(row.profiles);
      return {
        profileId: String(profile?.id ?? row.profile_id ?? ""),
        email: String(profile?.email ?? "unknown"),
        name: profile?.name ? String(profile.name) : null,
        membershipRole: String(row.role ?? "member"),
        profileRole: profile?.role ? String(profile.role) : null,
        isActive: profile?.is_active !== false,
      };
    }
  );

  const shows: SetupShow[] = showRows.map((show) => ({
    id: String(show.id),
    name: String(show.name),
    eventDateStart: String(show.event_date_start),
    eventDateEnd: show.event_date_end ? String(show.event_date_end) : null,
    venueName: show.venue_name ? String(show.venue_name) : null,
    currentStage: String(show.current_stage ?? "confirmed"),
    machines: (Array.isArray(show.machine_instances) ? show.machine_instances : [])
      .map((raw) => {
        const machine = raw as Record<string, unknown>;
        const id = String(machine.id);
        const type = firstRelated(machine.machines);
        return {
          id,
          serialNumber: String(machine.serial_number ?? ""),
          nickname: machine.nickname ? String(machine.nickname) : null,
          zone: machine.zone ? String(machine.zone) : null,
          mission: machine.mission ? String(machine.mission) : null,
          status: String(machine.status ?? "available"),
          machineTypeName: type?.name ? String(type.name) : null,
          sponsorName: sponsorByMachine.get(id) ?? null,
          hasSlot: sponsorByMachine.has(id),
        };
      })
      .sort((a, b) => a.serialNumber.localeCompare(b.serialNumber)),
  }));

  const row = partner as Record<string, unknown>;
  return {
    id: String(row.id),
    name: String(row.name),
    slug: String(row.slug),
    status: String(row.status ?? "active"),
    contactName: row.contact_name ? String(row.contact_name) : null,
    contactEmail: row.contact_email ? String(row.contact_email) : null,
    partnerCode: row.partner_code ? String(row.partner_code) : null,
    team,
    shows,
  };
}

/**
 * An embedded relation comes back as an object or a single-element array
 * depending on how PostgREST resolved it. Normalise to the object.
 */
function firstRelated(value: unknown): Record<string, unknown> | undefined {
  if (Array.isArray(value)) return value[0] as Record<string, unknown> | undefined;
  return (value as Record<string, unknown> | null) ?? undefined;
}

/** A show an admin can hand to an organizer. */
export interface LinkableShow {
  id: string;
  name: string;
  eventDateStart: string;
  venueName: string | null;
}

/**
 * Shows with no organizer yet, soonest first.
 *
 * Only unclaimed shows are offered: moving a show between organizers goes
 * through an explicit unlink so nobody's sponsor inventory moves by accident.
 */
export async function getLinkableShows(limit = 50): Promise<LinkableShow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("events")
    .select("id, name, event_date_start, venue_name")
    .is("organizer_partner_id", null)
    .order("event_date_start", { ascending: false })
    .limit(limit);

  if (error || !data) {
    logQueryError("getLinkableShows", error);
    return [];
  }
  return (data as Record<string, unknown>[]).map((row) => ({
    id: String(row.id),
    name: String(row.name),
    eventDateStart: String(row.event_date_start),
    venueName: row.venue_name ? String(row.venue_name) : null,
  }));
}

/** A registered unit standing in the warehouse, free to deploy. */
export interface AssignableMachine {
  id: string;
  serialNumber: string;
  nickname: string | null;
  machineTypeName: string | null;
}

/**
 * Units not at any show, not retired, and not permanently sited in a venue.
 *
 * The venue estate matters: those units sit on the concourse earning media
 * revenue against a placement, so they aren't ours to move onto a show floor
 * even though no event holds them.
 */
export async function getAssignableMachines(): Promise<AssignableMachine[]> {
  const supabase = await createClient();
  const [instancesRes, placedRes] = await Promise.all([
    supabase
      .from("machine_instances")
      .select("id, serial_number, nickname, status, machines ( name )")
      .is("current_event_id", null)
      .order("serial_number"),
    supabase
      .from("placements")
      .select("machine_instance_id, status")
      .in("status", ["active", "planned"]),
  ]);

  const { data, error } = instancesRes;
  if (error || !data) {
    logQueryError("getAssignableMachines", error);
    return [];
  }

  const venuePlaced = new Set(
    ((placedRes.data ?? []) as Record<string, unknown>[])
      .filter((row) => row.machine_instance_id)
      .map((row) => String(row.machine_instance_id))
  );

  return (data as Record<string, unknown>[])
    .filter((row) => String(row.status ?? "") !== "retired")
    .filter((row) => !venuePlaced.has(String(row.id)))
    .map((row) => {
      const type = firstRelated(row.machines);
      return {
        id: String(row.id),
        serialNumber: String(row.serial_number ?? ""),
        nickname: row.nickname ? String(row.nickname) : null,
        machineTypeName: type?.name ? String(type.name) : null,
      };
    });
}
