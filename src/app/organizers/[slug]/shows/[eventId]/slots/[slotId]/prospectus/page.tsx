/**
 * Prospectus block for one sponsorship slot — copy-paste inventory for an organizer prospectus.
 */
import Image from "next/image";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { PrintButton } from "@/components/organizers/PrintButton";
import { requireOrganizerContext } from "@/lib/auth/organizer-portal";
import { formatMoneyFromPence } from "@/lib/currency";
import { formatDateMedium } from "@/lib/dates";
import {
  buildExpectation,
  expectationBasisLabel,
  formatRange,
  showDayCount,
  type Expectation,
} from "@/lib/metrics/expected-performance";
import { getBenchmarksForEventType } from "@/lib/queries/benchmarks";
import { getSlotCollateral } from "@/lib/queries/slot-collateral";

interface Props {
  params: Promise<{ slug: string; eventId: string; slotId: string }>;
}

export const metadata = {
  title: "Sponsorship prospectus",
  robots: { index: false, follow: false },
};

function ExpectedPerformanceStrip({
  plays,
  leads,
  days,
}: {
  plays: Expectation | null;
  leads: Expectation | null;
  days: number;
}) {
  if (!plays && !leads) return null;
  const basis = expectationBasisLabel((plays ?? leads)!);

  return (
    <section className="mt-8 border border-neutral-200 p-5 print:border-neutral-300">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
        Expected performance
      </h2>
      <div className="mt-4 grid grid-cols-2 gap-6">
        {plays && (
          <div>
            <p className="text-xs uppercase tracking-wide text-neutral-500">Plays</p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-neutral-900">
              {formatRange(plays.perDayLow, plays.perDayHigh)}
            </p>
            <p className="text-xs text-neutral-600">
              a day
              {days > 1
                ? ` · ${formatRange(plays.totalLow, plays.totalHigh)} across ${days} days`
                : ""}
            </p>
          </div>
        )}
        {leads && (
          <div>
            <p className="text-xs uppercase tracking-wide text-neutral-500">Leads</p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-neutral-900">
              {formatRange(leads.perDayLow, leads.perDayHigh)}
            </p>
            <p className="text-xs text-neutral-600">
              a day
              {days > 1
                ? ` · ${formatRange(leads.totalLow, leads.totalHigh)} across ${days} days`
                : ""}
            </p>
          </div>
        )}
      </div>
      <p className="mt-4 text-xs text-neutral-500">
        {`${basis}. A range, not a promise — footfall, placement and how long the doors are open all move it.`}
      </p>
    </section>
  );
}

export default async function SlotProspectusPage({ params }: Props) {
  const { slug, eventId, slotId } = await params;
  const { partnerId } = await requireOrganizerContext(slug);

  const collateral = await getSlotCollateral(slotId, partnerId);
  if (!collateral || collateral.show.id !== eventId) return notFound();

  const { slot, show, spec } = collateral;
  const eventType = show.eventType ?? "activation";
  const machineType = spec?.slug ?? null;
  const days = showDayCount(slot.startDate, slot.endDate);

  const benchmarks = await getBenchmarksForEventType(eventType);
  const expectedPlays = buildExpectation(benchmarks, {
    metric: "plays",
    eventType,
    machineType,
    days,
  });
  const expectedLeads = buildExpectation(benchmarks, {
    metric: "leads",
    eventType,
    machineType,
    days,
  });

  const headline = [spec?.name ?? slot.machineLabel, slot.zone].filter(Boolean).join(" · ");
  const sponsorGets = [
    spec?.capacityLabel ? `Capacity: ${spec.capacityLabel}` : null,
    spec?.mechanisms.length ? `Dispense: ${spec.mechanisms.join(", ")}` : null,
    spec?.dispenses.length ? `Hands out: ${spec.dispenses.join(", ")}` : null,
  ].filter(Boolean) as string[];

  const footprintPower = [spec?.footprintMm, spec?.powerSpec].filter(Boolean).join(" · ");
  const priceLine =
    slot.pricePence != null ? formatMoneyFromPence(slot.pricePence) : "On request";

  return (
    <div className="min-h-screen bg-neutral-100 py-8 print:bg-white print:py-0">
      <div className="mx-auto max-w-3xl px-6 print:max-w-none print:px-0">
        <div className="mb-4 flex items-center justify-between print:hidden">
          <Link
            href={`/organizers/${slug}/shows/${eventId}#inventory`}
            className="inline-flex items-center gap-1.5 text-sm text-neutral-600 hover:text-neutral-900"
          >
            <ArrowLeft size={14} /> Back to inventory
          </Link>
          <PrintButton />
        </div>

        <article className="border border-neutral-200 bg-white p-10 print:border-0 print:p-0">
          <header className="border-b border-neutral-900 pb-4">
            <p className="text-xs uppercase tracking-[0.2em] text-neutral-500">
              Sponsorship inventory — {show.name}
            </p>
            <h1 className="mt-2 text-2xl font-bold text-neutral-900">{headline}</h1>
          </header>

          {spec?.heroImageUrl ? (
            <div className="relative mt-6 aspect-[16/9] w-full border border-neutral-200 bg-neutral-50">
              <Image
                src={spec.heroImageUrl}
                alt={spec.name}
                fill
                sizes="(min-width: 768px) 768px, 100vw"
                className="object-cover"
              />
            </div>
          ) : null}

          {sponsorGets.length > 0 ? (
            <section className="mt-6">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                What the sponsor gets
              </h2>
              <ul className="mt-3 space-y-1.5 text-sm text-neutral-800">
                {sponsorGets.map((line) => (
                  <li key={line} className="flex gap-2">
                    <span className="text-neutral-400">•</span>
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <ExpectedPerformanceStrip
            plays={expectedPlays}
            leads={expectedLeads}
            days={days}
          />

          <section className="mt-8 border-t border-neutral-200 pt-4">
            <p className="text-sm text-neutral-700">
              <span className="font-semibold text-neutral-900">Dates: </span>
              {formatDateMedium(slot.startDate)} – {formatDateMedium(slot.endDate)}
            </p>
            <p className="mt-1 text-sm text-neutral-700">
              <span className="font-semibold text-neutral-900">Price: </span>
              {priceLine}
            </p>
            {footprintPower ? (
              <p className="mt-1 text-sm text-neutral-700">
                <span className="font-semibold text-neutral-900">Footprint &amp; power: </span>
                {footprintPower}
              </p>
            ) : null}
          </section>
        </article>
      </div>
    </div>
  );
}
