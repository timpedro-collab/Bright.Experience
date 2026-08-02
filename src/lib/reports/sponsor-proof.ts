/**
 * Per-sponsor proof-of-performance for a show's post-event report.
 *
 * A show slot is one machine for one date range, so a sponsor's numbers are
 * the telemetry from that machine inside those dates — not the show total.
 * Kept pure so the report action stays a thin fetch-and-assemble layer.
 *
 * Output is deliberately counter-only: this block is written into a report
 * that gets shared with the sponsor, and lead rows belong to the brand that
 * ran the activation.
 */
import { toSponsorPerformance, type SponsorPerformance } from "@/lib/sponsor-pitch";

/** A sponsorship slot as the report action reads it. */
export interface SponsorSlotRow {
  id: string;
  sponsor_name?: string | null;
  machine_instance_id?: string | null;
  start_date: string;
  end_date: string;
  status: string;
  machine_instances?:
    | { serial_number?: string | null; nickname?: string | null; zone?: string | null }
    | { serial_number?: string | null; nickname?: string | null; zone?: string | null }[]
    | null;
}

/** A telemetry row, narrowed to the columns this needs. */
export interface SponsorTelemetryRow {
  event_type: string;
  timestamp: string;
  machine_instance_id?: string | null;
}

/** One sponsor's slot and what it delivered. */
export interface SponsorProof extends SponsorPerformance {
  slotId: string;
  sponsorName: string;
  zone: string | null;
  machineLabel: string | null;
  startDate: string;
  endDate: string;
}

function firstMachine(slot: SponsorSlotRow) {
  const rel = slot.machine_instances;
  if (!rel) return null;
  return Array.isArray(rel) ? rel[0] ?? null : rel;
}

/** Inclusive day window — a slot's end date counts in full, not to midnight. */
function withinWindow(timestamp: string, startDate: string, endDate: string): boolean {
  const day = timestamp.slice(0, 10);
  return day >= startDate && day <= endDate;
}

/**
 * Build the per-sponsor block for a report.
 *
 * Only sold slots appear: an unsold slot has no sponsor to prove anything to,
 * and listing it would tell every sponsor what the organizer failed to sell.
 */
export function buildSponsorProof(
  slots: SponsorSlotRow[],
  telemetry: SponsorTelemetryRow[]
): SponsorProof[] {
  const sold = slots.filter(
    (slot) => slot.status !== "available" && slot.machine_instance_id
  );
  if (sold.length === 0) return [];

  return sold
    .map((slot): SponsorProof => {
      let plays = 0;
      let leads = 0;
      let prizes = 0;

      for (const row of telemetry) {
        if (row.machine_instance_id !== slot.machine_instance_id) continue;
        if (!withinWindow(row.timestamp, slot.start_date, slot.end_date)) continue;
        if (row.event_type === "play_started" || row.event_type === "play_completed") plays++;
        else if (row.event_type === "lead_captured" || row.event_type === "lead") leads++;
        else if (row.event_type === "prize_awarded") prizes++;
      }

      const machine = firstMachine(slot);
      return {
        slotId: slot.id,
        sponsorName: slot.sponsor_name?.trim() || "Unnamed sponsor",
        zone: machine?.zone ?? null,
        machineLabel: machine?.nickname || machine?.serial_number || null,
        startDate: slot.start_date,
        endDate: slot.end_date,
        ...toSponsorPerformance({ plays, leads, prizes }),
      };
    })
    .sort((a, b) => b.plays - a.plays || a.sponsorName.localeCompare(b.sponsorName));
}
