"use client";

/**
 * One sponsor slot on the rate card, with its pitch-link controls.
 *
 * The controls themselves live in {@link PitchLinkControls} so the show and
 * machine pages offer exactly the same thing.
 */

import Link from "next/link";

import { SlotStatusBadge } from "./SlotStatusBadge";
import { PitchLinkControls } from "./PitchLinkControls";
import { formatDateShort } from "@/lib/dates";
import { formatMoneyFromPence } from "@/lib/currency";
import { missionLabel } from "@/lib/fleet-labels";
import type { SlotUrgency } from "@/lib/metrics/sponsor-book";
import type { MachineMission } from "@/types";

export interface SponsorSlotView {
  id: string;
  eventId: string | null;
  showName: string;
  /** Links back to the show this slot was sold on, when it has one. */
  showHref?: string | null;
  /** Links to the unit running the slot, when one is assigned. */
  machineHref?: string | null;
  sponsorName: string | null;
  status: string;
  startDate: string;
  endDate: string;
  price: number | null;
  pitchToken: string | null;
  /** ISO expiry of the current pitch token, when one is live. */
  pitchTokenExpiresAt?: string | null;
  zone: string | null;
  mission: MachineMission | null;
  machineLabel: string | null;
}

interface SponsorSlotRowProps {
  slot: SponsorSlotView;
  /**
   * Commercial read on the slot, when the caller has scored it. Only ever a
   * warning about *unsold* inventory — a sold slot needs no chasing, and the
   * status badge already says so.
   */
  urgency?: SlotUrgency;
  /** Days until this slot's show opens, resolved server-side. */
  daysToDoors?: number;
  /** Hides the show name where the surrounding heading already carries it. */
  hideShowName?: boolean;
}

/** The nudge for an unsold slot, or null when there is nothing to chase. */
function urgencyNote(
  urgency: SlotUrgency | undefined,
  daysToDoors: number
): { label: string; tone: string } | null {
  if (urgency === "closing") {
    return {
      label:
        daysToDoors === 0
          ? "Unsold, doors today"
          : `Unsold, ${daysToDoors} day${daysToDoors === 1 ? "" : "s"} left`,
      tone: "text-warning",
    };
  }
  if (urgency === "missed") {
    return { label: "Went unsold", tone: "text-muted-foreground" };
  }
  return null;
}

export function SponsorSlotRow({
  slot,
  urgency,
  daysToDoors = 0,
  hideShowName = false,
}: SponsorSlotRowProps) {
  const note = urgencyNote(urgency, daysToDoors);

  return (
    <li className="flex flex-wrap items-center justify-between gap-4 px-5 py-4">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-medium text-foreground">
            {slot.sponsorName ?? "Open slot"}
          </p>
          <SlotStatusBadge status={slot.status} />
        </div>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {hideShowName ? null : slot.showHref ? (
            <Link href={slot.showHref} className="hover:text-foreground hover:underline">
              {slot.showName}
            </Link>
          ) : (
            slot.showName
          )}
          {slot.machineLabel && !hideShowName ? " · " : ""}
          {slot.machineLabel && slot.machineHref ? (
            <Link
              href={slot.machineHref}
              className="hover:text-foreground hover:underline"
            >
              {slot.machineLabel}
            </Link>
          ) : (
            slot.machineLabel
          )}
          {slot.zone ? ` · ${slot.zone}` : ""}
          {slot.mission ? ` · ${missionLabel(slot.mission)}` : ""}
        </p>
        <p className="mt-0.5 text-xs text-tertiary">
          {formatDateShort(slot.startDate)} – {formatDateShort(slot.endDate)}
          {slot.price != null ? ` · ${formatMoneyFromPence(slot.price)}` : ""}
        </p>
        {note && (
          <p className={`mt-1 text-xs font-medium ${note.tone}`}>{note.label}</p>
        )}
      </div>

      <PitchLinkControls
        slotId={slot.id}
        pitchToken={slot.pitchToken}
        expiresAt={slot.pitchTokenExpiresAt ?? null}
        className="shrink-0 text-right"
      />
    </li>
  );
}
