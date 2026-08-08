/**
 * Organizer portal — every show this organizer runs.
 *
 * The landing page after sign-in, so it opens with the portfolio numbers
 * (hardware out there, what still needs a decision, sponsor money sold and
 * left) and then a card per show carrying the same numbers at show scale.
 * Anything needing the organizer's attention is named on the card rather than
 * left for them to find by opening each show in turn.
 */
import type { Metadata } from "next";
import Link from "next/link";
import {
  CalendarDays,
  Cpu,
  ArrowRight,
  MapPin,
  Wallet,
  TicketPercent,
  Activity,
  Users,
  AlertTriangle,
  CheckCircle2,
  Hourglass,
} from "lucide-react";

import { PortalPageShell, organizerTabs, organizerRoleLabel } from "@/components/brand";
import { EditorialEyebrow, Hairline } from "@/components/brand";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/ui/stat-card";
import { EmptyState } from "@/components/ui/EmptyState";

import { requireOrganizerContext } from "@/lib/auth/organizer-portal";
import {
  getShowsByOrganizer,
  getOrganizerPitchTelemetry,
  type OrganizerShow,
} from "@/lib/queries/organizers";
import { getUnreadCount } from "@/lib/queries/notifications";
import { portfolioTotals } from "@/lib/metrics/organizer-portfolio";
import { countdownLabel, daysToDoors } from "@/lib/metrics/show-schedule";
import { formatDateShort, formatDateGB } from "@/lib/dates";
import { formatMoneyFromPence } from "@/lib/currency";
import { cn } from "@/lib/utils";
import { STAGE_CONFIG, type Stage } from "@/types";
import { entityTitle, getPartnerNameForTitle } from "@/lib/queries/page-titles";

interface Props {
  params: Promise<{ slug: string }>;
}

/** Shows still to come sort ahead of ones that have already run. */
function isUpcoming(show: { eventDateEnd: string | null; eventDateStart: string }): boolean {
  const end = new Date(show.eventDateEnd ?? show.eventDateStart);
  return end.getTime() >= new Date().setHours(0, 0, 0, 0);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  return { title: entityTitle("Shows", await getPartnerNameForTitle(slug)) };
}

export default async function OrganizerShowsPage({ params }: Props) {
  const { slug } = await params;
  const { user, partnerId, partnerName } = await requireOrganizerContext(slug);

  const [shows, unread, pitchTelemetry] = await Promise.all([
    getShowsByOrganizer(partnerId),
    getUnreadCount(user.id),
    getOrganizerPitchTelemetry(partnerId),
  ]);

  const upcoming = shows.filter(isUpcoming);
  const past = shows.filter((s) => !isUpcoming(s));
  const totals = portfolioTotals(shows.map((s) => s.summary));

  return (
    <PortalPageShell
      user={user}
      roleLabel={organizerRoleLabel(user.role)}
      unreadCount={unread}
      scope={partnerName}
      section="Shows"
      slug={slug}
      tabs={organizerTabs(slug)}
      title="Your shows"
      subtitle={
        shows.length === 0
          ? "Shows appear here once your Bright.Blue contact sets them up."
          : `${totals.shows} show${totals.shows === 1 ? "" : "s"} · ${
              totals.machines
            } machine${totals.machines === 1 ? "" : "s"} deployed.`
      }
    >
      {shows.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title="Your shows"
          description="Each show lists its fleet, live performance, and sponsor inventory in one place. Bright.Blue sets them up on your account — none are linked yet."
          tone="flat"
        />
      ) : (
        <>
          <section>
            <EditorialEyebrow>Across your shows</EditorialEyebrow>
            <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
              <StatCard
                label="Machines"
                value={totals.machines}
                icon={Cpu}
                hint={`${totals.online} reporting in right now`}
              />
              <StatCard
                label="Needs setting up"
                value={totals.needsSetup}
                icon={MapPin}
                tone={totals.needsSetup > 0 ? "warning" : "success"}
                hint={
                  totals.needsSetup > 0
                    ? "Units missing a zone or a job"
                    : "Every unit has a zone and a job"
                }
              />
              <StatCard
                label="Sponsorship sold"
                value={
                  totals.slots > 0 ? formatMoneyFromPence(totals.soldValue) : "—"
                }
                icon={Wallet}
                hint={
                  totals.slots > 0
                    ? `${totals.slots} slot${totals.slots === 1 ? "" : "s"} opened`
                    : "No slots opened yet"
                }
              />
              <StatCard
                label="Still to sell"
                value={
                  totals.openValue > 0
                    ? formatMoneyFromPence(totals.openValue)
                    : "—"
                }
                icon={TicketPercent}
                tone={totals.openValue > 0 ? "info" : "default"}
                hint={
                  totals.openValue > 0
                    ? "Open slots waiting on a sponsor"
                    : "Nothing sitting unsold"
                }
              />
            </div>

            <Card className="mt-3">
              <CardContent className="p-4">
                {pitchTelemetry.totalViews === 0 ? (
                  <p className="text-sm text-foreground">
                    Share a sponsor pitch link to start tracking interest.
                  </p>
                ) : (
                  <>
                    <p className="text-sm text-foreground">
                      Your pitch links have been opened {pitchTelemetry.totalViews} times
                    </p>
                    {pitchTelemetry.lastViewedAt && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        Most recent open {formatDateGB(pitchTelemetry.lastViewedAt)}
                      </p>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </section>

          <Hairline className="my-8 opacity-60" />

          <div className="space-y-8">
            {upcoming.length > 0 && (
              <ShowList slug={slug} heading="Upcoming" shows={upcoming} upcoming />
            )}
            {past.length > 0 && <ShowList slug={slug} heading="Past" shows={past} />}
          </div>
        </>
      )}
    </PortalPageShell>
  );
}

function ShowList({
  slug,
  heading,
  shows,
  upcoming = false,
}: {
  slug: string;
  heading: string;
  shows: OrganizerShow[];
  upcoming?: boolean;
}) {
  return (
    <section>
      <p className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {heading}
      </p>
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        {shows.map((show) => (
          <ShowCard key={show.id} slug={slug} show={show} upcoming={upcoming} />
        ))}
      </div>
    </section>
  );
}

function ShowCard({
  slug,
  show,
  upcoming,
}: {
  slug: string;
  show: OrganizerShow;
  /** Doors haven't opened, so today's counters are all zero by definition. */
  upcoming: boolean;
}) {
  const { summary } = show;
  const offline = summary.machines - summary.online;
  const isLive = show.currentStage === "event_live";
  const daysAway = daysToDoors(show.eventDateStart);
  const ready = summary.machines - summary.needsSetup;
  // Before the doors open the card answers "how long, and how ready"; after
  // they do it answers "how is it going". Showing "Plays today 0" four months
  // out was reporting the calendar as if it were a problem.
  const isRunUp = upcoming && !isLive;
  const stageLabel =
    STAGE_CONFIG[show.currentStage as Stage]?.shortLabel ??
    show.currentStage.replace(/_/g, " ");

  // At most one line of attention per card — the organizer should read the
  // card, not triage it. Setup comes first because it's the thing only they
  // can fix; a silent machine is ours to chase.
  const attention =
    summary.needsSetup > 0
      ? `${summary.needsSetup} unit${
          summary.needsSetup === 1 ? "" : "s"
        } still need a zone or a job`
      : offline > 0 && summary.machines > 0
        ? `${offline} unit${offline === 1 ? "" : "s"} not reporting in`
        : null;

  return (
    <Link href={`/organizers/${slug}/shows/${show.id}`} className="group block">
      <Card className="h-full transition-colors group-hover:border-[var(--color-bb-cobalt)]/40 group-hover:bg-accent/50">
        <CardContent className="p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-heading truncate text-sm font-semibold text-foreground">
                {show.name}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {formatDateShort(show.eventDateStart)}
                {show.eventDateEnd ? ` – ${formatDateShort(show.eventDateEnd)}` : ""}
                {show.venueName ? ` · ${show.venueName}` : ""}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Badge
                variant="outline"
                className={cn(
                  "text-[0.65rem]",
                  isLive && "border-0 bg-success/10 text-success"
                )}
              >
                {stageLabel}
              </Badge>
              <ArrowRight
                size={14}
                className="text-muted-foreground/60 transition-colors group-hover:text-foreground"
              />
            </div>
          </div>

          <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 border-t border-border/50 pt-4 text-xs sm:grid-cols-4">
            <Metric
              icon={Cpu}
              label="Machines"
              value={`${summary.machines}`}
              hint={
                summary.zones > 0
                  ? `${summary.zones} zone${summary.zones === 1 ? "" : "s"}`
                  : "No zones set"
              }
            />
            <Metric
              icon={Wallet}
              label="Sold"
              value={
                summary.slots > 0
                  ? formatMoneyFromPence(summary.soldValue)
                  : "—"
              }
              hint={
                summary.slots > 0
                  ? `${summary.slotsSold} of ${summary.slots} slots`
                  : "No slots yet"
              }
            />
            {isRunUp ? (
              <>
                <Metric
                  icon={CheckCircle2}
                  label="Ready"
                  value={
                    summary.machines > 0 ? `${ready}/${summary.machines}` : "—"
                  }
                  hint={
                    summary.machines === 0
                      ? "No units yet"
                      : ready === summary.machines
                        ? "Placed and briefed"
                        : "Units still to place"
                  }
                />
                <Metric
                  icon={Hourglass}
                  label="To doors"
                  value={daysAway > 0 ? `${daysAway}d` : "Today"}
                  hint={countdownLabel(daysAway)}
                />
              </>
            ) : (
              <>
                <Metric
                  icon={Activity}
                  label="Plays today"
                  value={`${summary.playsToday}`}
                  hint={
                    isLive
                      ? "Live now"
                      : summary.playsToday > 0
                        ? "Latest day of play"
                        : "Show has finished"
                  }
                />
                <Metric
                  icon={Users}
                  label="Leads today"
                  value={`${summary.leadsToday}`}
                  hint={
                    summary.playsToday > 0
                      ? `${Math.round(
                          (summary.leadsToday / summary.playsToday) * 100
                        )}% opted in`
                      : "—"
                  }
                />
              </>
            )}
          </dl>

          {attention && (
            <p className="mt-3 flex items-center gap-1.5 text-xs text-warning">
              <AlertTriangle size={11} />
              {attention}
            </p>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div>
      <dt className="flex items-center gap-1 text-[0.65rem] uppercase tracking-wide text-muted-foreground">
        <Icon size={10} />
        {label}
      </dt>
      <dd className="mt-0.5 text-sm font-semibold tabular-nums text-foreground">
        {value}
      </dd>
      <dd className="text-[0.65rem] text-tertiary">{hint}</dd>
    </div>
  );
}
