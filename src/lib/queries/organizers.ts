/**
 * Supabase read queries for organizer shows.
 *
 * An organizer is a `partners` row of type `organizer`; their shows are
 * ordinary `events` rows carrying `organizer_partner_id`. RLS already scopes
 * these reads to the caller's own partner, so these queries stay simple and
 * never take a partner id from the request.
 */
import { createClient } from "@/lib/supabase/server";
import { getServiceRoleClient } from "@/lib/supabase/service-role";
import {
  buildMachineBreakdown,
  OFFLINE_AFTER_MS,
  type TelemetryRow,
} from "@/lib/metrics/fleet";
import type { FleetMachineRow } from "@/lib/metrics/fleet";
import {
  feedItemFromTelemetry,
  type FeedItem,
} from "@/lib/metrics/feed-labels";
import {
  buildShowSummary,
  type ShowSummary,
  type PortfolioMachineRow,
  type PortfolioSlotRow,
  type PortfolioTelemetryRow,
} from "@/lib/metrics/organizer-portfolio";
import {
  isPitchTokenValid,
  toSponsorPerformance,
  type SponsorPerformance,
} from "@/lib/sponsor-pitch";
import type { MachineMission } from "@/types";
import { logQueryError } from "@/lib/observability/log-query-error";

/** A show in the organizer's list, with everything it reads without opening. */
export interface OrganizerShow {
  id: string;
  name: string;
  eventDateStart: string;
  eventDateEnd: string | null;
  venueName: string | null;
  currentStage: string;
  healthStatus: string;
  machineCount: number;
  summary: ShowSummary;
}

/**
 * Shows run by an organizer partner, soonest first, each with its fleet,
 * sponsor inventory and today's activity rolled up.
 *
 * Three batched reads rather than one per show: the machines arrive embedded
 * with the events, then slots and today's telemetry are fetched once for the
 * whole set and grouped in memory. Telemetry is date-bounded, so this stays
 * flat as the organizer's book of shows grows.
 */
export async function getShowsByOrganizer(partnerId: string): Promise<OrganizerShow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("events")
    .select(
      `id, name, event_date_start, event_date_end, venue_name,
       current_stage, health_status,
       machine_instances ( id, zone, mission, last_heartbeat )`
    )
    .eq("organizer_partner_id", partnerId)
    .order("event_date_start", { ascending: true });

  if (error || !data) {
    logQueryError("getShowsByOrganizer", error, { partnerId });
    return [];
  }
  const rows = data as Record<string, unknown>[];
  const showIds = rows.map((row) => String(row.id));
  if (showIds.length === 0) return [];

  const today = new Date().toISOString().slice(0, 10);
  const [slotsRes, telemetryRes] = await Promise.all([
    supabase
      .from("sponsorship_slots")
      .select("event_id, status, price")
      .in("event_id", showIds),
    supabase
      .from("telemetry_events")
      .select("event_id, event_type")
      .in("event_id", showIds)
      .gte("timestamp", `${today}T00:00:00.000Z`)
      .lte("timestamp", `${today}T23:59:59.999Z`),
  ]);

  const slotsByShow = groupByEvent(slotsRes.data as Record<string, unknown>[] | null);
  const telemetryByShow = groupByEvent(
    telemetryRes.data as Record<string, unknown>[] | null
  );
  const now = Date.now();

  return rows.map((row) => {
    const id = String(row.id);
    const machines = Array.isArray(row.machine_instances)
      ? (row.machine_instances as PortfolioMachineRow[])
      : [];
    return {
      id,
      name: String(row.name),
      eventDateStart: String(row.event_date_start),
      eventDateEnd: row.event_date_end ? String(row.event_date_end) : null,
      venueName: row.venue_name ? String(row.venue_name) : null,
      currentStage: String(row.current_stage ?? "confirmed"),
      healthStatus: String(row.health_status ?? "on_track"),
      machineCount: machines.length,
      summary: buildShowSummary({
        machines,
        slots: (slotsByShow.get(id) ?? []) as PortfolioSlotRow[],
        telemetry: (telemetryByShow.get(id) ?? []) as PortfolioTelemetryRow[],
        now,
      }),
    };
  });
}

/** Bucket rows carrying an `event_id` by the show they belong to. */
function groupByEvent(
  rows: Record<string, unknown>[] | null
): Map<string, Record<string, unknown>[]> {
  const grouped = new Map<string, Record<string, unknown>[]>();
  for (const row of rows ?? []) {
    const id = String(row.event_id ?? "");
    if (!id) continue;
    const bucket = grouped.get(id);
    if (bucket) bucket.push(row);
    else grouped.set(id, [row]);
  }
  return grouped;
}

/**
 * A single show, confirmed to belong to the given organizer.
 *
 * Carries the install and collection dates and the venue address as well as
 * the show dates: the run-up view is built from the whole move-in to move-out
 * window, not just the days the doors are open. `event_type` and
 * `machine_type` come along because they are the keys the performance
 * benchmarks are matched on.
 */
export async function getOrganizerShow(eventId: string, partnerId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("events")
    .select(
      `id, name, event_date_start, event_date_end, setup_date, collection_date,
       venue_name, venue_address, event_type, machine_type,
       current_stage, health_status, organizer_partner_id`
    )
    .eq("id", eventId)
    .eq("organizer_partner_id", partnerId)
    .maybeSingle();

  if (error || !data) {
    logQueryError("getOrganizerShow", error, { eventId });
    return null;
  }
  return data as Record<string, unknown>;
}

/**
 * Server-rendered seed for the fleet board. The live route recomputes this
 * every poll; this exists so the page isn't blank before the first fetch.
 */
export async function getFleetBreakdownForShow(eventId: string) {
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);

  const [machinesRes, telemetryRes] = await Promise.all([
    supabase
      .from("machine_instances")
      .select("id, serial_number, nickname, zone, mission, status, last_heartbeat")
      .eq("current_event_id", eventId)
      .order("serial_number"),
    supabase
      .from("telemetry_events")
      .select("event_type, timestamp, machine_instance_id")
      .eq("event_id", eventId)
      .gte("timestamp", `${today}T00:00:00.000Z`)
      .lte("timestamp", `${today}T23:59:59.999Z`),
  ]);

  return buildMachineBreakdown(
    (machinesRes.data ?? []) as unknown as FleetMachineRow[],
    (telemetryRes.data ?? []) as unknown as TelemetryRow[]
  );
}

/** One unit on a show, with the hardware type it is. */
export interface ShowMachine {
  id: string;
  serialNumber: string;
  nickname: string | null;
  zone: string | null;
  mission: MachineMission | null;
  status: string;
  lastHeartbeat: string | null;
  firmwareVersion: string | null;
  machineTypeName: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  /** The catalogue record behind this unit. Null if the type row is missing. */
  spec: MachineSpec | null;
}

/**
 * What a unit is and what it needs to stand somewhere.
 *
 * The first half (photo, capacity, mechanisms) already existed for the public
 * catalogue and is what a sponsor is buying. The second half (footprint,
 * weight, power, connectivity, clearance) is what the organizer forwards to
 * their venue, and is the reason this is read on the portal at all.
 */
export interface MachineSpec {
  name: string;
  slug: string;
  tagline: string | null;
  capacityLabel: string | null;
  mechanisms: string[];
  dispenses: string[];
  features: string[];
  bestFor: string[];
  heroImageUrl: string | null;
  footprintMm: string | null;
  weightKg: number | null;
  powerSpec: string | null;
  connectivity: string | null;
  clearanceNotes: string | null;
}

/** Columns of `machines` the portal reads. Shared by the machine and spec pages. */
const MACHINE_SPEC_COLUMNS =
  `name, slug, tagline, capacity_label, mechanisms, dispenses, features, best_for,
   hero_image_url, footprint_mm, weight_kg, power_spec, connectivity, clearance_notes`;

/** Coerce a jsonb list column into a string array, whatever shape it arrives in. */
function stringList(value: unknown): string[] {
  return Array.isArray(value) ? value.map((v) => String(v)) : [];
}

/** Map a joined `machines` row into the spec the portal renders. */
export function toMachineSpec(row: Record<string, unknown> | null): MachineSpec | null {
  if (!row) return null;
  return {
    name: String(row.name ?? ""),
    slug: String(row.slug ?? ""),
    tagline: row.tagline ? String(row.tagline) : null,
    capacityLabel: row.capacity_label ? String(row.capacity_label) : null,
    mechanisms: stringList(row.mechanisms),
    dispenses: stringList(row.dispenses),
    features: stringList(row.features),
    bestFor: stringList(row.best_for),
    heroImageUrl: row.hero_image_url ? String(row.hero_image_url) : null,
    footprintMm: row.footprint_mm ? String(row.footprint_mm) : null,
    weightKg: row.weight_kg != null ? Number(row.weight_kg) : null,
    powerSpec: row.power_spec ? String(row.power_spec) : null,
    connectivity: row.connectivity ? String(row.connectivity) : null,
    clearanceNotes: row.clearance_notes ? String(row.clearance_notes) : null,
  };
}

/** Unwrap a Supabase embedded relation, which arrives as a row or a one-row array. */
function firstRelated(value: unknown): Record<string, unknown> | null {
  if (Array.isArray(value)) return (value[0] as Record<string, unknown>) ?? null;
  return (value as Record<string, unknown>) ?? null;
}

/**
 * A single machine, confirmed to be standing at the given show.
 *
 * The event scope is the authorization: a machine id that belongs to somebody
 * else's show returns null, so the page 404s rather than leaking that the
 * unit exists.
 */
export async function getShowMachine(
  eventId: string,
  machineInstanceId: string
): Promise<ShowMachine | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("machine_instances")
    .select(
      `id, serial_number, nickname, zone, mission, status, last_heartbeat,
       firmware_version, created_at, updated_at,
       machines ( ${MACHINE_SPEC_COLUMNS} )`
    )
    .eq("id", machineInstanceId)
    .eq("current_event_id", eventId)
    .maybeSingle();

  if (error || !data) {
    logQueryError("getShowMachine", error, { eventId });
    return null;
  }

  const row = data as Record<string, unknown>;
  const spec = toMachineSpec(firstRelated(row.machines));

  return {
    id: String(row.id),
    serialNumber: String(row.serial_number ?? ""),
    nickname: row.nickname ? String(row.nickname) : null,
    zone: row.zone ? String(row.zone) : null,
    mission: (row.mission as MachineMission | null) ?? null,
    status: String(row.status ?? "available"),
    lastHeartbeat: row.last_heartbeat ? String(row.last_heartbeat) : null,
    firmwareVersion: row.firmware_version ? String(row.firmware_version) : null,
    machineTypeName: spec?.name || null,
    createdAt: row.created_at ? String(row.created_at) : null,
    updatedAt: row.updated_at ? String(row.updated_at) : null,
    spec,
  };
}

/**
 * The creative attached to a sponsor slot, with where each piece sits in
 * review. Ids come from the slot's own `creative_asset_ids`, so this never
 * widens beyond artwork the organizer already attached.
 */
export async function getSlotCreative(
  eventId: string,
  assetIds: string[]
): Promise<ShowCreativeOption[]> {
  if (assetIds.length === 0) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("assets")
    .select("id, name, asset_type, review_status, created_at")
    .eq("event_id", eventId)
    .in("id", assetIds);

  if (error || !data) {
    logQueryError("getSlotCreative", error, { eventId });
    return [];
  }
  return (data as Record<string, unknown>[]).map((row) => ({
    id: String(row.id),
    name: String(row.name),
    assetType: String(row.asset_type ?? ""),
    reviewStatus: String(row.review_status ?? "pending_review"),
    createdAt: row.created_at ? String(row.created_at) : null,
  }));
}

/**
 * Recent telemetry for one unit, as feed rows.
 *
 * Counters and event types only — the payload column is never selected, so
 * nothing a visitor typed into the machine can reach an organizer's screen.
 */
export async function getMachineActivity(
  eventId: string,
  machineInstanceId: string,
  limit = 20
): Promise<FeedItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("telemetry_events")
    .select("id, event_type, timestamp, machine_instance_id")
    .eq("event_id", eventId)
    .eq("machine_instance_id", machineInstanceId)
    .order("timestamp", { ascending: false })
    .limit(limit);

  if (error || !data) {
    logQueryError("getMachineActivity", error, { eventId });
    return [];
  }
  return (data as Record<string, unknown>[]).map(feedItemFromTelemetry);
}

/** The sponsor slot sold on one machine, if it has been sold. */
export async function getSlotForMachine(
  eventId: string,
  machineInstanceId: string
) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("sponsorship_slots")
    .select(
      `id, sponsor_name, status, start_date, end_date, price, pitch_token,
       pitch_token_expires_at, creative_asset_ids`
    )
    .eq("event_id", eventId)
    .eq("machine_instance_id", machineInstanceId)
    .order("start_date", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    logQueryError("getSlotForMachine", error, { eventId });
    return null;
  }
  return data as Record<string, unknown>;
}

/** Sponsorship slots sold against a show's machines. */
export async function getSlotsByEvent(eventId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("sponsorship_slots")
    .select(
      `id, event_id, machine_instance_id, sponsor_account_id, sponsor_name,
       start_date, end_date, price, status, creative_asset_ids,
       pitch_token, pitch_token_expires_at, created_at, updated_at,
       machine_instances ( id, serial_number, nickname, zone, mission )`
    )
    .eq("event_id", eventId)
    .order("start_date", { ascending: true });

  if (error || !data) {
    logQueryError("getSlotsByEvent", error, { eventId });
    return [];
  }
  return data as Record<string, unknown>[];
}

/** A creative asset an organizer can attach to a sponsor slot. */
export interface ShowCreativeOption {
  id: string;
  name: string;
  assetType: string;
  reviewStatus: string;
  /** When the artwork landed, for the run-up story. */
  createdAt?: string | null;
}

/**
 * The show's creative library, for the slot creative picker. Only uploaded
 * artwork the brand shares appears: a placeholder row with nothing behind it
 * can't run on a machine, and an internal working file isn't the organizer's
 * to attach. The `customer_visible` filter mirrors the RLS policy exactly, so
 * the mock and a real database show the same list.
 */
export async function getShowCreativeOptions(
  eventId: string
): Promise<ShowCreativeOption[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("assets")
    .select("id, name, asset_type, review_status, file_url, created_at")
    .eq("event_id", eventId)
    .eq("customer_visible", true)
    .not("file_url", "is", null)
    .order("name");

  if (error || !data) {
    logQueryError("getShowCreativeOptions", error, { eventId });
    return [];
  }
  return (data as Record<string, unknown>[]).map((row) => ({
    id: String(row.id),
    name: String(row.name),
    assetType: String(row.asset_type ?? ""),
    reviewStatus: String(row.review_status ?? "pending_review"),
    createdAt: row.created_at ? String(row.created_at) : null,
  }));
}

/**
 * Resolve a sponsor pitch link.
 *
 * Server-enforced: the token must match, must not have expired, and only
 * aggregate performance comes back. Returns null for anything questionable
 * so the page renders a plain 404 rather than confirming a token exists.
 *
 * Reads through the service-role client because the caller is anonymous and
 * RLS deliberately gives anon no access to sponsorship inventory at all. The
 * token is the credential, and it is checked here — not delegated to a
 * policy that would have to leave the table readable to the whole internet.
 * The column list is the contract: no lead-bearing table is touched. The
 * catalogue join is the machine's own public specification — the same rows
 * the marketing site renders — so the sponsor sees what they are buying
 * without widening what a token can reach.
 */
export async function getSlotByPitchToken(token: string) {
  if (!token || token.length < 20) return null;

  const supabase = getServiceRoleClient();
  const { data, error } = await supabase
    .from("sponsorship_slots")
    .select(
      `id, event_id, machine_instance_id, sponsor_name, start_date, end_date,
       price, status, pitch_token, pitch_token_expires_at,
       machine_instances (
         id, serial_number, nickname, zone, mission,
         machines ( ${MACHINE_SPEC_COLUMNS} )
       ),
       events (
         id, name, event_date_start, event_date_end, venue_name,
         event_type, machine_type
       )`
    )
    .eq("pitch_token", token)
    .maybeSingle();

  if (error || !data) {
    logQueryError("getSlotByPitchToken", error, { token });
    return null;
  }
  if (!isPitchTokenValid(data.pitch_token_expires_at as string | null)) return null;
  return data as Record<string, unknown>;
}

/**
 * Aggregate performance for one machine over a date window — what a sponsor
 * bought and what it delivered. Deliberately returns counters only; lead rows
 * never leave the brand's own surfaces.
 *
 * Service-role for the same reason as {@link getSlotByPitchToken}: the caller
 * holding a valid token is anonymous. Only `telemetry_events` counters are
 * read, and only for the one machine and window the token resolved to.
 */
export async function getSlotPerformance(
  eventId: string,
  machineInstanceId: string,
  startDate: string,
  endDate: string
): Promise<SponsorPerformance> {
  const supabase = getServiceRoleClient();
  const { data } = await supabase
    .from("telemetry_events")
    .select("event_type")
    .eq("event_id", eventId)
    .eq("machine_instance_id", machineInstanceId)
    .gte("timestamp", `${startDate}T00:00:00.000Z`)
    .lte("timestamp", `${endDate}T23:59:59.999Z`);

  let plays = 0;
  let leads = 0;
  let prizes = 0;
  for (const row of (data ?? []) as { event_type: string }[]) {
    const type = String(row.event_type);
    if (type === "play_started" || type === "play_completed") plays++;
    else if (type === "lead_captured" || type === "lead") leads++;
    else if (type === "prize_awarded") prizes++;
  }

  return toSponsorPerformance({ plays, leads, prizes });
}

/** A unit on the organizer's fleet list, with the show it stands at. */
export interface OrganizerFleetMachine extends ShowMachine {
  eventId: string;
  showName: string;
  sponsorName: string | null;
  /**
   * Heartbeat freshness, resolved here rather than at render: a page is not
   * allowed to read the clock while rendering, and one timestamp for the whole
   * list is more consistent anyway.
   */
  isOnline: boolean;
}

/**
 * Every machine across an organizer's shows.
 *
 * Powers the portfolio-wide Fleet tab: one list answering "where is
 * everything and what is it doing", including which units are already sold.
 */
export async function getFleetByOrganizer(
  partnerId: string
): Promise<OrganizerFleetMachine[]> {
  const supabase = await createClient();
  const { data: shows } = await supabase
    .from("events")
    .select("id, name")
    .eq("organizer_partner_id", partnerId);

  const showIds = (shows ?? []).map((s) => String((s as { id: string }).id));
  if (showIds.length === 0) return [];

  const [machinesRes, slotsRes] = await Promise.all([
    supabase
      .from("machine_instances")
      .select(
        `id, serial_number, nickname, zone, mission, status, last_heartbeat,
         firmware_version, created_at, updated_at, current_event_id,
         machines ( ${MACHINE_SPEC_COLUMNS} )`
      )
      .in("current_event_id", showIds)
      .order("zone"),
    supabase
      .from("sponsorship_slots")
      .select("machine_instance_id, sponsor_name")
      .in("event_id", showIds)
      .not("sponsor_name", "is", null),
  ]);

  const showNames = new Map(
    (shows ?? []).map((s) => [
      String((s as { id: string }).id),
      String((s as { name: string }).name),
    ])
  );
  const sponsors = new Map(
    ((slotsRes.data ?? []) as Record<string, unknown>[])
      .filter((s) => s.machine_instance_id)
      .map((s) => [String(s.machine_instance_id), String(s.sponsor_name)])
  );

  const now = Date.now();

  return ((machinesRes.data ?? []) as Record<string, unknown>[]).map((row) => {
    const spec = toMachineSpec(firstRelated(row.machines));
    const id = String(row.id);
    const heartbeat = row.last_heartbeat ? String(row.last_heartbeat) : null;
    return {
      id,
      serialNumber: String(row.serial_number ?? ""),
      nickname: row.nickname ? String(row.nickname) : null,
      zone: row.zone ? String(row.zone) : null,
      mission: (row.mission as MachineMission | null) ?? null,
      status: String(row.status ?? "available"),
      lastHeartbeat: heartbeat,
      firmwareVersion: row.firmware_version ? String(row.firmware_version) : null,
      machineTypeName: spec?.name || null,
      createdAt: row.created_at ? String(row.created_at) : null,
      updatedAt: row.updated_at ? String(row.updated_at) : null,
      spec,
      eventId: String(row.current_event_id ?? ""),
      showName: showNames.get(String(row.current_event_id)) ?? "Unknown show",
      sponsorName: sponsors.get(id) ?? null,
      isOnline: heartbeat
        ? now - new Date(heartbeat).getTime() < OFFLINE_AFTER_MS
        : false,
    };
  });
}

/** Every slot across an organizer's shows, for the portal-wide sponsor view. */
export async function getSlotsByOrganizer(partnerId: string) {
  const supabase = await createClient();
  const { data: shows } = await supabase
    .from("events")
    .select("id, name")
    .eq("organizer_partner_id", partnerId);

  const showIds = (shows ?? []).map((s) => String((s as { id: string }).id));
  if (showIds.length === 0) return [];

  const { data, error } = await supabase
    .from("sponsorship_slots")
    .select(
      `id, event_id, machine_instance_id, sponsor_account_id, sponsor_name,
       start_date, end_date, price, status, pitch_token, pitch_token_expires_at,
       machine_instances ( id, serial_number, nickname, zone, mission )`
    )
    .in("event_id", showIds)
    .order("start_date", { ascending: true });

  if (error || !data) {
    logQueryError("getSlotsByOrganizer", error, { partnerId });
    return [];
  }

  const showNames = new Map(
    (shows ?? []).map((s) => [
      String((s as { id: string }).id),
      String((s as { name: string }).name),
    ])
  );
  return (data as Record<string, unknown>[]).map(
    (slot): Record<string, unknown> & { show_name: string } => ({
      ...slot,
      show_name: showNames.get(String(slot.event_id)) ?? "Unknown show",
    })
  );
}
