/**
 * Co-branded one-pager for one sponsorship slot — the sales sheet an organizer sends a sponsor.
 */
import Image from "next/image";
import { notFound } from "next/navigation";

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
import { createClient } from "@/lib/supabase/server";

interface Props {
  params: Promise<{ slug: string; eventId: string; slotId: string }>;
}

export const metadata = {
  title: "Sponsorship one-pager",
  robots: { index: false, follow: false },
};

/** Co-brand-safe partner fields for the one-pager header. */
async function getPartnerBranding(partnerId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("partners")
    .select("name, logo_url, brand_color")
    .eq("id", partnerId)
    .maybeSingle();
  return data;
}

function ExpectedPerformanceBand({
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
    <section className="mt-5 border border-neutral-200 p-4 print:border-neutral-300">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
        Expected performance
      </h2>
      <div className="mt-3 grid grid-cols-2 gap-4">
        {plays && (
          <div>
            <p className="text-xs uppercase tracking-wide text-neutral-500">Plays</p>
            <p className="mt-1 text-xl font-bold tabular-nums text-neutral-900">
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
            <p className="mt-1 text-xl font-bold tabular-nums text-neutral-900">
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
      <p className="mt-3 text-xs text-neutral-500">
        {`${basis}. A range, not a promise — footfall, placement and how long the doors are open all move it.`}
      </p>
    </section>
  );
}

export default async function SlotOnePagerPage({ params }: Props) {
  const { slug, eventId, slotId } = await params;
  const { partnerId, partnerName } = await requireOrganizerContext(slug);

  const collateral = await getSlotCollateral(slotId, partnerId);
  if (!collateral || collateral.show.id !== eventId) return notFound();

  const { slot, show, spec } = collateral;
  const partner = await getPartnerBranding(partnerId);
  const organizerName = partner?.name ? String(partner.name) : partnerName;
  const logoUrl = partner?.logo_url ? String(partner.logo_url) : null;

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

  const showDates = [
    formatDateMedium(show.eventDateStart),
    show.eventDateEnd ? formatDateMedium(show.eventDateEnd) : null,
  ]
    .filter(Boolean)
    .join(" – ");

  const priceLine =
    slot.pricePence != null ? formatMoneyFromPence(slot.pricePence) : "On request";

  const benefits = [
    "Crowd-stopping activation where your audience already is",
    "Measured plays and leads — reporting within 24 hours of close",
    "Zero effort for you — Bright.Blue handles machine, wrap, delivery and ops",
  ];

  return (
    <div className="min-h-screen bg-neutral-100 py-8 print:bg-white print:py-0">
      <div className="mx-auto max-w-3xl px-6 print:max-w-none print:px-0">
        <div className="mb-4 flex items-center justify-end print:hidden">
          <PrintButton />
        </div>

        <article className="border border-neutral-200 bg-white p-8 print:border-0 print:p-0">
          <header className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-200 pb-4">
            <div className="flex items-center gap-3">
              {logoUrl ? (
                <Image
                  src={logoUrl}
                  alt={organizerName}
                  width={120}
                  height={32}
                  className="h-8 w-auto object-contain"
                />
              ) : null}
              <p className="text-sm font-semibold text-neutral-900">{organizerName}</p>
            </div>
            <p className="text-xs uppercase tracking-[0.15em] text-neutral-500">
              in partnership with Bright.Blue
            </p>
          </header>

          <section className="mt-5">
            <h1 className="text-2xl font-bold text-neutral-900">{show.name}</h1>
            <p className="mt-1 text-sm text-neutral-700">{showDates}</p>
            {show.venueName ? (
              <p className="text-sm text-neutral-600">{show.venueName}</p>
            ) : null}
          </section>

          {spec?.heroImageUrl ? (
            <div className="relative mt-4 aspect-[16/9] w-full border border-neutral-200 bg-neutral-50">
              <Image
                src={spec.heroImageUrl}
                alt={spec.name}
                fill
                sizes="(min-width: 768px) 768px, 100vw"
                className="object-cover"
              />
            </div>
          ) : null}

          <ul className="mt-4 space-y-1.5 text-sm leading-snug text-neutral-800">
            {benefits.map((line) => (
              <li key={line} className="flex gap-2">
                <span className="text-neutral-400">—</span>
                <span>{line}</span>
              </li>
            ))}
          </ul>

          <ExpectedPerformanceBand
            plays={expectedPlays}
            leads={expectedLeads}
            days={days}
          />

          <section className="mt-5 border border-neutral-200 p-4 print:border-neutral-300">
            <div className="flex items-baseline justify-between gap-4">
              <p className="text-sm font-medium text-neutral-900">Slot investment</p>
              <p className="text-xl font-bold tabular-nums text-neutral-900">{priceLine}</p>
            </div>
          </section>

          <footer className="mt-5 border border-neutral-900 p-4 print:border-neutral-900">
            <p className="text-base font-semibold text-neutral-900">
              Reserve this slot — contact {organizerName}
            </p>
          </footer>
        </article>
      </div>
    </div>
  );
}
