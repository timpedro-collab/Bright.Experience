/** Loads printable sponsorship slot collateral for organizer sales sheets. */
import { createClient } from "@/lib/supabase/server";
import { logQueryError } from "@/lib/observability/log-query-error";
import { toMachineSpec } from "@/lib/queries/organizers";

const MACHINE_SPEC_COLUMNS =
  `name, slug, tagline, capacity_label, mechanisms, dispenses, features, best_for,
   hero_image_url, footprint_mm, weight_kg, power_spec, connectivity, clearance_notes`;

/** Unwrap a Supabase embedded relation, which arrives as a row or a one-row array. */
function firstRelated(value: unknown): Record<string, unknown> | null {
  if (Array.isArray(value)) return (value[0] as Record<string, unknown>) ?? null;
  return (value as Record<string, unknown>) ?? null;
}

export interface SlotCollateral {
  slot: {
    id: string;
    sponsorName: string | null;
    status: string;
    startDate: string;
    endDate: string;
    pricePence: number | null;
    zone: string | null;
    mission: string | null;
    machineLabel: string;
  };
  show: {
    id: string;
    name: string;
    venueName: string | null;
    eventDateStart: string;
    eventDateEnd: string | null;
    eventType: string | null;
  };
  spec: ReturnType<typeof toMachineSpec>;
}

/**
 * One sponsorship slot with show context and machine spec, scoped to the
 * organizer partner that owns the show.
 */
export async function getSlotCollateral(
  slotId: string,
  partnerId: string
): Promise<SlotCollateral | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("sponsorship_slots")
    .select(
      `id, sponsor_name, status, start_date, end_date, price,
       machine_instances (
         id, serial_number, nickname, zone, mission,
         machines ( ${MACHINE_SPEC_COLUMNS} )
       ),
       events (
         id, name, venue_name, event_date_start, event_date_end, event_type, machine_type,
         organizer_partner_id
       )`
    )
    .eq("id", slotId)
    .maybeSingle();

  if (error || !data) {
    logQueryError("getSlotCollateral", error, { slotId });
    return null;
  }

  const row = data as Record<string, unknown>;
  const show = firstRelated(row.events);
  if (!show || String(show.organizer_partner_id) !== partnerId) return null;

  const machine = firstRelated(row.machine_instances);
  const spec = toMachineSpec(firstRelated(machine?.machines));

  const nickname = machine?.nickname ? String(machine.nickname) : null;
  const serial = machine?.serial_number ? String(machine.serial_number) : null;
  const machineLabel = nickname ?? serial ?? "Unit TBC";

  return {
    slot: {
      id: String(row.id),
      sponsorName: row.sponsor_name ? String(row.sponsor_name) : null,
      status: String(row.status ?? ""),
      startDate: String(row.start_date),
      endDate: String(row.end_date),
      pricePence: row.price != null ? Number(row.price) : null,
      zone: machine?.zone ? String(machine.zone) : null,
      mission: machine?.mission ? String(machine.mission) : null,
      machineLabel,
    },
    show: {
      id: String(show.id),
      name: String(show.name),
      venueName: show.venue_name ? String(show.venue_name) : null,
      eventDateStart: String(show.event_date_start),
      eventDateEnd: show.event_date_end ? String(show.event_date_end) : null,
      eventType: show.event_type ? String(show.event_type) : null,
    },
    spec,
  };
}
