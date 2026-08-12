/**
 * Public, token-gated sponsor page.
 *
 * Before the show it reads as a pitch: what the machine is, where it stands,
 * what it's expected to do, what the slot includes and what units like it have
 * done elsewhere. During and after, the same link becomes proof of
 * performance, so a sponsor never has to chase a PDF.
 *
 * The pre-show half is a sales document, so everything on it is either stored
 * fact (the machine's own catalogue record, the dates, the zone) or a
 * benchmark range that names its sample size. No projection is presented as a
 * promise — the range is the honest form of the answer, and the number that
 * gets quoted back at us after the show.
 *
 * Security posture: the token is a capability URL. It is server-validated
 * (match plus expiry) in `getSlotByPitchToken`, marked `noindex` so it never
 * gets crawled, and carries aggregate counters only — no lead-level data
 * reaches this surface. See lib/sponsor-pitch.ts.
 */
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { Cpu, MapPin, CalendarDays, Activity, Users, Gift, Percent, Monitor } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UnitPassport } from "@/components/organizers/UnitPassport";
import { ExpectedPerformance } from "@/components/organizers/ExpectedPerformance";
import { SlotRoiCalculator } from "@/components/organizers/SlotRoiCalculator";
import { WhatYouGet } from "@/components/sponsors/WhatYouGet";
import { CaseStudyStrip } from "@/components/sponsors/CaseStudyStrip";
import { SponsorInterestForm } from "@/components/sponsors/SponsorInterestForm";
import {
  getSlotByPitchToken,
  getSlotPerformance,
  toMachineSpec,
} from "@/lib/queries/organizers";
import { getBenchmarksForEventType } from "@/lib/queries/benchmarks";
import { getCaseStudies } from "@/lib/queries/case-studies";
import { toCaseStudyProof } from "@/lib/marketing/case-study-stats";
import {
  buildExpectation,
  showDayCount,
} from "@/lib/metrics/expected-performance";
import {
  PITCH_UNLOCK_COOKIE,
  isPitchUnlocked,
  pitchTokenDaysRemaining,
  slotMediaValue,
} from "@/lib/sponsor-pitch";
import { PitchDetailGate } from "@/components/sponsors/PitchDetailGate";
import { InvitationFooter } from "@/components/public/InvitationFooter";
import { recordPitchView } from "@/server/pitch-views";
import { formatDateShort } from "@/lib/dates";
import { formatMoneyFromPence } from "@/lib/currency";
import { missionLabel, MISSION_DESCRIPTIONS } from "@/lib/fleet-labels";
import type { MachineMission } from "@/types";

interface Props {
  params: Promise<{ token: string }>;
}

export const metadata: Metadata = {
  title: "Sponsor opportunity",
  // A capability URL must never be indexed: the link is the credential.
  robots: { index: false, follow: false, nocache: true },
};

function first(value: unknown): Record<string, unknown> | null {
  if (Array.isArray(value)) return (value[0] as Record<string, unknown>) ?? null;
  return (value as Record<string, unknown>) ?? null;
}

function Stat({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <Card>
      <CardContent className="p-5 text-center">
        <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10 text-brand">
          {icon}
        </div>
        <p className="text-heading text-2xl font-bold tabular-nums text-foreground">
          {value}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">{label}</p>
      </CardContent>
    </Card>
  );
}

export default async function SponsorPitchPage({ params }: Props) {
  const { token } = await params;
  const slot = await getSlotByPitchToken(token);
  if (!slot) return notFound();

  const machine = first(slot.machine_instances);
  const show = first(slot.events);
  if (!show) return notFound();

  // Count the open so the rep knows the link landed. Fire-and-forget; a
  // failed count never breaks the page.
  await recordPitchView(String(slot.id));

  const startDate = String(slot.start_date);
  const endDate = String(slot.end_date);
  const hasRun = new Date(startDate) <= new Date();

  // Detail gate: the page reads free; the performance figures unlock in
  // exchange for light identity (recorded for nurture, never a hard sell).
  const jar = await cookies();
  const detailsUnlocked = isPitchUnlocked(
    jar.get(PITCH_UNLOCK_COOKIE)?.value,
    String(slot.id)
  );

  const performance =
    hasRun && machine?.id
      ? await getSlotPerformance(
          String(slot.event_id),
          String(machine.id),
          startDate,
          endDate
        )
      : null;

  const mission = (machine?.mission as MachineMission | null) ?? null;
  const daysLeft = pitchTokenDaysRemaining(
    slot.pitch_token_expires_at as string | null
  );

  // The pitch half is the only part that needs evidence, so nothing extra is
  // fetched once the slot has run and the counters speak for themselves.
  const spec = performance ? null : toMachineSpec(first(machine?.machines));
  const eventType = String(show.event_type ?? "activation");
  const machineType = show.machine_type ? String(show.machine_type) : null;
  const days = showDayCount(startDate, endDate);

  const [benchmarks, caseStudyRows] = performance
    ? [[], []]
    : await Promise.all([
        getBenchmarksForEventType(eventType),
        getCaseStudies(),
      ]);

  const expectedPlays = performance
    ? null
    : buildExpectation(benchmarks, {
        metric: "plays",
        eventType,
        machineType,
        days,
      });
  const expectedLeads = performance
    ? null
    : buildExpectation(benchmarks, {
        metric: "leads",
        eventType,
        machineType,
        days,
      });
  const caseStudies = toCaseStudyProof(
    caseStudyRows as unknown as Record<string, unknown>[]
  );

  const placement = first(slot.placements);
  const placementVenue = placement ? first(placement.venues) : null;
  const mediaValueCents =
    performance === null
      ? slotMediaValue({
          footfallEstimate: placement?.footfall_estimate as number | null,
          startDate,
          endDate,
          venueTier: placementVenue?.location_tier as string | null,
        })
      : null;

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {String(show.name)}
      </p>
      <h1 className="text-heading mt-2 text-3xl font-bold text-foreground">
        {slot.sponsor_name
          ? `A machine reserved for ${String(slot.sponsor_name)}`
          : "Your machine at the show"}
      </h1>
      <p className="mt-3 text-muted-foreground">
        {performance
          ? "Here's how your machine performed."
          : "A Bright.Blue machine, branded as yours, placed where your audience already is."}
      </p>

      <div className="mt-8 space-y-3">
        <div className="flex items-center gap-3 text-sm text-foreground">
          <CalendarDays size={16} className="text-muted-foreground" />
          {formatDateShort(startDate)} – {formatDateShort(endDate)}
        </div>
        {machine?.zone ? (
          <div className="flex items-center gap-3 text-sm text-foreground">
            <MapPin size={16} className="text-muted-foreground" />
            {String(machine.zone)}
            {show.venue_name ? `, ${String(show.venue_name)}` : ""}
          </div>
        ) : null}
        {mission ? (
          <div className="flex items-start gap-3 text-sm text-foreground">
            <Cpu size={16} className="mt-0.5 shrink-0 text-muted-foreground" />
            <span>
              {missionLabel(mission)}
              <span className="block text-xs text-muted-foreground">
                {MISSION_DESCRIPTIONS[mission]}
              </span>
            </span>
          </div>
        ) : null}
      </div>

      {performance ? (
        <section className="mt-10">
          {detailsUnlocked ? (
            <>
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <Stat
                  label="Plays"
                  value={performance.plays.toLocaleString("en-US")}
                  icon={<Activity size={20} />}
                />
                <Stat
                  label="Leads captured"
                  value={performance.leads.toLocaleString("en-US")}
                  icon={<Users size={20} />}
                />
                <Stat
                  label="Prizes given"
                  value={performance.prizes.toLocaleString("en-US")}
                  icon={<Gift size={20} />}
                />
                <Stat
                  label="Opt-in rate"
                  value={`${performance.optInRate}%`}
                  icon={<Percent size={20} />}
                />
              </div>
              <p className="mt-4 text-xs text-muted-foreground">
                Contact details captured at your machine are delivered to you
                directly under your own consent notice; they are not shown on
                this page.
              </p>
            </>
          ) : (
            <PitchDetailGate
              token={token}
              sponsorName={slot.sponsor_name as string | null}
            />
          )}
        </section>
      ) : (
        <div className="mt-10 space-y-6">
          {spec && (
            <section>
              <p className="text-heading mb-4 text-sm font-semibold text-foreground">
                The machine
              </p>
              <UnitPassport spec={spec} />
            </section>
          )}

          {detailsUnlocked ? (
            <ExpectedPerformance
              plays={expectedPlays}
              leads={expectedLeads}
              days={days}
              title="What a machine like this usually does"
            />
          ) : (
            <PitchDetailGate
              token={token}
              sponsorName={slot.sponsor_name as string | null}
            />
          )}

          <WhatYouGet />

          <CaseStudyStrip studies={caseStudies} />

          <Card>
            <CardContent className="p-6">
              <div className="flex items-baseline justify-between gap-4">
                <p className="text-sm font-medium text-foreground">
                  Slot investment
                </p>
                <p className="text-heading text-2xl font-bold tabular-nums text-foreground">
                  {slot.price ? formatMoneyFromPence(Number(slot.price)) : "On request"}
                </p>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">
                Everything above, for the dates shown, at{" "}
                {show.venue_name ? String(show.venue_name) : "the show"}.
              </p>
              <div className="mt-4">
                <Badge variant="outline" className="text-[0.65rem]">
                  {String(slot.status) === "available" ? "Available" : "Reserved for you"}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {detailsUnlocked && slot.price && expectedLeads ? (
            <SlotRoiCalculator
              pricePence={Number(slot.price)}
              leadsLow={expectedLeads.totalLow}
              leadsHigh={expectedLeads.totalHigh}
            />
          ) : null}

          {mediaValueCents != null ? (
            <Card>
              <CardContent className="p-6 text-center">
                <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10 text-brand">
                  <Monitor size={20} />
                </div>
                <p className="text-heading text-2xl font-bold tabular-nums text-foreground">
                  Up to {formatMoneyFromPence(mediaValueCents)}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Equivalent DOOH media value
                </p>
                <p className="mt-3 text-xs text-muted-foreground">
                  What the same impressions would cost on premium digital
                  out-of-home at a comparable site. A ceiling, not a promise.
                </p>
              </CardContent>
            </Card>
          ) : null}

          <SponsorInterestForm
            token={token}
            sponsorName={slot.sponsor_name as string | null}
            showName={String(show.name)}
          />
        </div>
      )}

      <p className="mt-10 text-xs text-muted-foreground">
        This link is private to you and expires in {daysLeft}{" "}
        {daysLeft === 1 ? "day" : "days"}. Questions go to your show contact.
      </p>

      {/* An invitation, not a credit — a sponsor here is a future customer. */}
      <InvitationFooter
        artifact="sponsor_pitch"
        fromEvent={String(show.name)}
        className="mt-8"
      />
    </main>
  );
}
