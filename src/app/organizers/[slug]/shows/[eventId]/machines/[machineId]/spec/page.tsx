/**
 * Venue spec sheet for one unit — a page built to leave the portal.
 *
 * Every exhibition venue asks for footprint, weight, power and connectivity
 * before it will approve anything on its floor, usually on a form with a
 * deadline weeks ahead of move-in. Organizers were emailing us for those
 * numbers and waiting. This is the same data as one printable sheet naming the
 * show, the stand and the unit, so it can be forwarded without a covering note.
 *
 * Deliberately outside the portal shell: no navigation, no tabs, nothing that
 * would print. Access still runs through the organizer guard — a venue sheet
 * carries the show name and the stand, so it is not public.
 */
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { PrintButton } from "@/components/organizers/PrintButton";
import { requireOrganizerContext } from "@/lib/auth/organizer-portal";
import { getOrganizerShow, getShowMachine } from "@/lib/queries/organizers";
import { formatDateMedium } from "@/lib/dates";
import { missionLabel } from "@/lib/fleet-labels";

interface Props {
  params: Promise<{ slug: string; eventId: string; machineId: string }>;
}

export const metadata = {
  title: "Machine spec sheet",
  // A sheet naming a client's show and stand has no business in a search index.
  robots: { index: false, follow: false },
};

function Row({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <tr className="border-b border-neutral-200 align-top">
      <th className="w-56 py-2.5 pr-4 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500">
        {label}
      </th>
      <td className="py-2.5 text-sm text-neutral-900">{value}</td>
    </tr>
  );
}

export default async function MachineSpecSheetPage({ params }: Props) {
  const { slug, eventId, machineId } = await params;
  const { partnerId, partnerName } = await requireOrganizerContext(slug);

  const show = await getOrganizerShow(eventId, partnerId);
  if (!show) return notFound();

  const machine = await getShowMachine(eventId, machineId);
  if (!machine?.spec) return notFound();

  const spec = machine.spec;
  const unitName = machine.nickname ?? machine.serialNumber;
  const dates = [
    show.setup_date ? `Install ${formatDateMedium(String(show.setup_date))}` : null,
    `Open ${formatDateMedium(String(show.event_date_start))}`,
    show.event_date_end
      ? `Close ${formatDateMedium(String(show.event_date_end))}`
      : null,
    show.collection_date
      ? `Collection ${formatDateMedium(String(show.collection_date))}`
      : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="min-h-screen bg-neutral-100 py-8 print:bg-white print:py-0">
      <div className="mx-auto max-w-3xl px-6 print:max-w-none print:px-0">
        <div className="mb-4 flex items-center justify-between print:hidden">
          <Link
            href={`/organizers/${slug}/shows/${eventId}/machines/${machineId}`}
            className="inline-flex items-center gap-1.5 text-sm text-neutral-600 hover:text-neutral-900"
          >
            <ArrowLeft size={14} /> Back to the unit
          </Link>
          <PrintButton />
        </div>

        <article className="border border-neutral-200 bg-white p-10 print:border-0 print:p-0">
          <header className="border-b border-neutral-900 pb-4">
            <p className="text-xs uppercase tracking-[0.2em] text-neutral-500">
              Bright.Blue · Machine site requirements
            </p>
            <h1 className="mt-2 text-2xl font-bold text-neutral-900">
              {spec.name}
            </h1>
            {spec.tagline && (
              <p className="mt-1 text-sm text-neutral-600">{spec.tagline}</p>
            )}
          </header>

          <section className="mt-6">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
              Where it is going
            </h2>
            <table className="mt-2 w-full border-collapse">
              <tbody>
                <Row label="Show" value={String(show.name)} />
                <Row
                  label="Venue"
                  value={
                    [show.venue_name, show.venue_address]
                      .filter(Boolean)
                      .map(String)
                      .join(", ") || null
                  }
                />
                <Row label="Dates" value={dates} />
                <Row label="Organizer" value={partnerName} />
                <Row label="Stand or zone" value={machine.zone} />
                <Row label="Unit" value={unitName} />
                {/* A venue reading "Unassigned" learns nothing; the row is for
                    telling them what the unit is there to do, or nothing. */}
                <Row
                  label="Purpose"
                  value={machine.mission ? missionLabel(machine.mission) : null}
                />
              </tbody>
            </table>
          </section>

          <section className="mt-8">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
              What the venue needs to provide
            </h2>
            <table className="mt-2 w-full border-collapse">
              <tbody>
                <Row label="Installed footprint" value={spec.footprintMm} />
                <Row
                  label="Operating weight"
                  value={spec.weightKg ? `${spec.weightKg} kg` : null}
                />
                <Row label="Power" value={spec.powerSpec} />
                <Row label="Connectivity" value={spec.connectivity} />
                <Row label="Service clearance" value={spec.clearanceNotes} />
              </tbody>
            </table>
          </section>

          <section className="mt-8">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
              About the unit
            </h2>
            <table className="mt-2 w-full border-collapse">
              <tbody>
                <Row label="Capacity" value={spec.capacityLabel} />
                <Row
                  label="Dispense mechanisms"
                  value={spec.mechanisms.join(", ") || null}
                />
                <Row label="Hands out" value={spec.dispenses.join(", ") || null} />
                <Row label="Serial" value={machine.serialNumber} />
                <Row label="Firmware" value={machine.firmwareVersion} />
              </tbody>
            </table>
          </section>

          <footer className="mt-8 border-t border-neutral-200 pt-4 text-xs leading-relaxed text-neutral-500">
            <p>
              Figures are indicative and issued for planning. Confirm them with
              your Bright.Blue contact before they are entered into venue
              paperwork or a health and safety submission. Our crew installs,
              tests and collects every unit; the venue is asked only for the
              floor space, the power supply and access on the dates above.
            </p>
            <p className="mt-2">
              Prepared {formatDateMedium(new Date().toISOString())} · Bright.Blue
            </p>
          </footer>
        </article>
      </div>
    </div>
  );
}
