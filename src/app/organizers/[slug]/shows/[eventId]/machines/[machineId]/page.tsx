/**
 * One unit at a show — the organizer's page for a single machine.
 *
 * The page answers a different question depending on when you open it. While
 * the show runs it is a scoreboard: what is this unit doing right now. Before
 * it opens — which is where an organizer spends most of the year — it is a
 * preparation view: what is still outstanding, what the venue needs to know,
 * what it should be expected to deliver, and what has happened so far. A
 * zeroed counter four months out told them nothing, so it isn't shown.
 *
 * Everything an organizer can change about a unit (its zone and its mission)
 * is editable here; the game configuration is read-only because it belongs to
 * the delivery team and the brand whose activation it is.
 */
import { notFound } from "next/navigation";
import Link from "next/link";
import { Handshake, ArrowRight } from "lucide-react";

import { PortalPageShell, organizerTabs, organizerRoleLabel } from "@/components/brand";
import { EditorialEyebrow, Hairline } from "@/components/brand";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MachineLiveClient } from "@/components/organizers/MachineLiveClient";
import { MachineDeploymentForm } from "@/components/organizers/MachineDeploymentForm";
import { MachineConfigCard } from "@/components/organizers/MachineConfigCard";
import { SlotStatusBadge } from "@/components/organizers/SlotStatusBadge";
import { PitchLinkControls } from "@/components/organizers/PitchLinkControls";
import { UnitReadinessCard } from "@/components/organizers/UnitReadinessCard";
import { UnitPassport } from "@/components/organizers/UnitPassport";
import { SiteRequirements } from "@/components/organizers/SiteRequirements";
import { KeyDates } from "@/components/organizers/KeyDates";
import { SetupStoryFeed } from "@/components/organizers/SetupStoryFeed";
import { ExpectedPerformance } from "@/components/organizers/ExpectedPerformance";

import { requireOrganizerContext } from "@/lib/auth/organizer-portal";
import {
  getOrganizerShow,
  getShowMachine,
  getFleetBreakdownForShow,
  getMachineActivity,
  getSlotForMachine,
  getSlotCreative,
} from "@/lib/queries/organizers";
import { getBenchmarksForEventType } from "@/lib/queries/benchmarks";
import {
  getGameConfigurations,
  getProductConfigurations,
} from "@/app/actions/game-config";
import { getGameNameById } from "@/lib/queries/games";
import { getUnreadCount } from "@/lib/queries/notifications";
import {
  resolveConfigForMachine,
  hasOverride,
} from "@/lib/configuration/resolve-config";
import { formatDateShort } from "@/lib/dates";
import { formatMoneyFromPence } from "@/lib/currency";
import { missionLabel, MISSION_DESCRIPTIONS } from "@/lib/fleet-labels";
import { showRunState } from "@/lib/metrics/organizer-portfolio";
import { unitReadinessFor } from "@/lib/metrics/show-readiness";
import { buildSetupStory } from "@/lib/metrics/setup-story";
import {
  buildShowSchedule,
  countdownLabel,
  daysToDoors,
} from "@/lib/metrics/show-schedule";
import {
  buildExpectation,
  showDayCount,
} from "@/lib/metrics/expected-performance";
import type { MachineBreakdown } from "@/lib/metrics/fleet";

interface Props {
  params: Promise<{ slug: string; eventId: string; machineId: string }>;
}

/** Zero-filled stats so the page renders before any telemetry exists. */
function emptyStats(machineId: string): MachineBreakdown {
  return {
    machine_instance_id: machineId,
    serial_number: "",
    nickname: null,
    zone: null,
    mission: null,
    status: "available",
    last_heartbeat: null,
    is_online: false,
    plays: 0,
    leads: 0,
    prizes: 0,
    rejected: 0,
  };
}

export default async function ShowMachinePage({ params }: Props) {
  const { slug, eventId, machineId } = await params;
  const { user, partnerId, partnerName } = await requireOrganizerContext(slug);

  const show = await getOrganizerShow(eventId, partnerId);
  if (!show) return notFound();

  const machine = await getShowMachine(eventId, machineId);
  if (!machine) return notFound();

  const [breakdown, activity, slot, configs, productConfigs, benchmarks, unread] =
    await Promise.all([
      getFleetBreakdownForShow(eventId),
      getMachineActivity(eventId, machineId),
      getSlotForMachine(eventId, machineId),
      getGameConfigurations(eventId),
      getProductConfigurations(eventId),
      getBenchmarksForEventType(String(show.event_type ?? "activation")),
      getUnreadCount(user.id),
    ]);

  const creativeIds = Array.isArray(slot?.creative_asset_ids)
    ? (slot.creative_asset_ids as string[])
    : [];
  const creative = await getSlotCreative(eventId, creativeIds);

  const stats =
    breakdown.find((m) => m.machine_instance_id === machineId) ??
    emptyStats(machineId);

  // Zones already in use at this show, offered as quick picks so a fleet
  // doesn't end up with "Hall 3", "hall 3" and "Hall Three".
  const knownZones = Array.from(
    new Set(breakdown.map((m) => m.zone).filter((z): z is string => Boolean(z)))
  ).sort();

  const config = resolveConfigForMachine(configs, machineId);
  const isOverride = hasOverride(configs, machineId);
  const gameName = config?.gameId ? await getGameNameById(config.gameId) : null;
  // A unit's own product plan wins; otherwise it draws on the show's.
  const stock = resolveConfigForMachine(productConfigs, machineId);

  const title = machine.nickname ?? machine.serialNumber;
  const showName = String(show.name);
  const startDate = String(show.event_date_start);
  const endDate = show.event_date_end ? String(show.event_date_end) : null;

  const runState = showRunState(startDate, endDate);
  const isLive = runState === "running" || show.current_stage === "event_live";
  const isUpcoming = runState === "upcoming" && !isLive;
  const dormantLabel =
    runState === "upcoming"
      ? `Opens ${formatDateShort(startDate)}`
      : "Show has finished";
  const daysAway = daysToDoors(startDate);

  const schedule = buildShowSchedule({
    setupDate: show.setup_date ? String(show.setup_date) : null,
    startDate,
    endDate,
    collectionDate: show.collection_date ? String(show.collection_date) : null,
  });

  const inventoryHref = `/organizers/${slug}/shows/${eventId}#inventory`;
  const readiness = unitReadinessFor(
    {
      id: machineId,
      label: machine.nickname ?? machine.serialNumber,
      zone: machine.zone,
      mission: machine.mission,
      // A screen-only unit has nothing to load, and the catalogue is the only
      // place that knows which units dispense.
      dispensesProduct: (machine.spec?.dispenses.length ?? 1) > 0,
    },
    {
      gameConfigs: configs,
      productConfigs,
      slots: slot
        ? [
            {
              machineInstanceId: machineId,
              sponsorName: slot.sponsor_name ? String(slot.sponsor_name) : null,
              status: String(slot.status),
              creativeAssetIds: creativeIds,
            },
          ]
        : [],
      creativeReview: Object.fromEntries(
        creative.map((piece) => [piece.id, piece.reviewStatus])
      ),
      hrefs: {
        zone: "#deployment",
        mission: "#deployment",
        sponsor: inventoryHref,
        creative: inventoryHref,
      },
    }
  );

  const setupStory = buildSetupStory({
    machine: {
      createdAt: machine.createdAt,
      updatedAt: machine.updatedAt,
      zone: machine.zone,
      mission: machine.mission,
    },
    config: config
      ? {
          status: config.status,
          submittedAt: config.submittedAt,
          updatedAt: config.updatedAt,
        }
      : null,
    slot: slot
      ? {
          sponsorName: slot.sponsor_name ? String(slot.sponsor_name) : null,
          createdAt: slot.created_at ? String(slot.created_at) : null,
          updatedAt: slot.updated_at ? String(slot.updated_at) : null,
        }
      : null,
    creative: creative.map((c) => ({
      name: c.name,
      reviewStatus: c.reviewStatus,
      createdAt: c.createdAt ?? null,
    })),
  });

  const days = showDayCount(startDate, endDate);
  const machineType = show.machine_type ? String(show.machine_type) : null;
  const eventType = String(show.event_type ?? "activation");
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

  return (
    <PortalPageShell
      user={user}
      roleLabel={organizerRoleLabel(user.role)}
      unreadCount={unread}
      scope={showName}
      section={title}
      slug={slug}
      tabs={organizerTabs(slug)}
      title={title}
      subtitle={
        <>
          {machine.zone ?? "No zone set"} · {missionLabel(machine.mission)}
          {machine.machineTypeName ? ` · ${machine.machineTypeName}` : ""}
        </>
      }
      backHref={`/organizers/${slug}/shows/${eventId}`}
      backLabel={`Back to ${showName}`}
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: partnerName, href: `/organizers/${slug}/shows` },
        { label: showName, href: `/organizers/${slug}/shows/${eventId}` },
        { label: title },
      ]}
      heroRight={
        <div className="flex items-center gap-2">
          {/* A unit for a show in December isn't "offline" — it's in the
              warehouse. Only judge signal while the show is open. */}
          {isLive ? (
            <Badge
              className={
                stats.is_online
                  ? "border-0 bg-success/10 text-success"
                  : "border-0 bg-warning/10 text-warning"
              }
            >
              {stats.is_online ? "Reporting in" : "No signal"}
            </Badge>
          ) : (
            <Badge variant="outline">
              {isUpcoming ? countdownLabel(daysAway) : dormantLabel}
            </Badge>
          )}
          {slot?.sponsor_name ? (
            <Badge variant="outline">Sold to {String(slot.sponsor_name)}</Badge>
          ) : null}
        </div>
      }
    >
      {isUpcoming ? (
        <>
          <section>
            <EditorialEyebrow>Key dates</EditorialEyebrow>
            <div className="mt-4">
              <KeyDates entries={schedule} />
            </div>
          </section>

          <Hairline className="my-8 opacity-60" />

          <section>
            <EditorialEyebrow>Getting ready</EditorialEyebrow>
            <div className="mt-4 grid grid-cols-1 gap-6 lg:grid-cols-2">
              <UnitReadinessCard
                items={readiness}
                timingHint={`${countdownLabel(daysAway)} · ${showName}`}
              />
              <div className="space-y-6">
                <ExpectedPerformance
                  plays={expectedPlays}
                  leads={expectedLeads}
                  days={days}
                />
                <SetupStoryFeed
                  entries={setupStory}
                  liveHint="Plays, leads and prizes replace this the moment the doors open."
                />
              </div>
            </div>
          </section>
        </>
      ) : (
        <>
          <MachineLiveClient
            eventId={eventId}
            machineInstanceId={machineId}
            initialStats={stats}
            initialFeed={activity}
            isLive={isLive}
            dormantLabel={dormantLabel}
          />

          <Hairline className="my-8 opacity-60" />

          <section>
            <EditorialEyebrow>Key dates</EditorialEyebrow>
            <div className="mt-4">
              <KeyDates entries={schedule} />
            </div>
          </section>
        </>
      )}

      <Hairline className="my-8 opacity-60" />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section id="deployment" className="scroll-mt-24">
          <EditorialEyebrow>Deployment</EditorialEyebrow>
          <p className="mb-4 mt-1 text-xs text-muted-foreground">
            {machine.mission
              ? MISSION_DESCRIPTIONS[machine.mission]
              : "Set what this unit is here to do so the right game runs on it."}
          </p>
          <Card>
            <CardContent className="p-5">
              <MachineDeploymentForm
                machineInstanceId={machine.id}
                zone={machine.zone}
                mission={machine.mission}
                knownZones={knownZones}
              />
            </CardContent>
          </Card>

          <div className="mt-6">
            <EditorialEyebrow>Sponsor</EditorialEyebrow>
            <div className="mt-3">
              {slot ? (
                <Card>
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-medium text-foreground">
                        {slot.sponsor_name ? String(slot.sponsor_name) : "Open slot"}
                      </p>
                      <SlotStatusBadge status={String(slot.status)} />
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {formatDateShort(String(slot.start_date))} –{" "}
                      {formatDateShort(String(slot.end_date))}
                      {slot.price != null
                        ? ` · ${formatMoneyFromPence(Number(slot.price))}`
                        : ""}
                    </p>
                    {creative.length > 0 && (
                      <p className="mt-2 text-xs text-muted-foreground">
                        Artwork:{" "}
                        {creative
                          .map(
                            (piece) =>
                              `${piece.name}${
                                piece.reviewStatus === "approved"
                                  ? ""
                                  : " (in review)"
                              }`
                          )
                          .join(", ")}
                      </p>
                    )}
                    <PitchLinkControls
                      slotId={String(slot.id)}
                      pitchToken={
                        slot.pitch_token ? String(slot.pitch_token) : null
                      }
                      expiresAt={
                        slot.pitch_token_expires_at
                          ? String(slot.pitch_token_expires_at)
                          : null
                      }
                      className="mt-3"
                    />
                    <Link
                      href={`/organizers/${slug}/sponsors`}
                      className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-[var(--color-bb-cobalt)] hover:underline"
                    >
                      See the whole rate card <ArrowRight size={12} />
                    </Link>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="p-5">
                    <p className="flex items-center gap-2 text-sm text-foreground">
                      <Handshake size={14} className="text-muted-foreground" />
                      Not sold to a sponsor
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Open this unit as inventory from the show page and it gets
                      its own private pitch link.
                    </p>
                    <Link
                      href={inventoryHref}
                      className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-[var(--color-bb-cobalt)] hover:underline"
                    >
                      Open a slot <ArrowRight size={12} />
                    </Link>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </section>

        <section>
          <EditorialEyebrow>Configuration</EditorialEyebrow>
          <p className="mb-4 mt-1 text-xs text-muted-foreground">
            What this unit will run on the day.
          </p>
          <MachineConfigCard
            config={config}
            isOverride={isOverride}
            gameName={gameName}
          />

          {stock?.totalUnits ? (
            <p className="mt-3 text-xs text-muted-foreground">
              {stock.totalUnits.toLocaleString("en-GB")} items planned for this
              show
              {stock.machineInstanceId ? " on this unit" : " across the fleet"}.
            </p>
          ) : null}
        </section>
      </div>

      {machine.spec && (
        <>
          <Hairline className="my-8 opacity-60" />

          <section>
            <EditorialEyebrow>The machine</EditorialEyebrow>
            <p className="mb-4 mt-1 text-xs text-muted-foreground">
              What this unit is, and what your venue needs to know about it.
            </p>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <UnitPassport
                spec={machine.spec}
                footnote={
                  machine.firmwareVersion
                    ? `${machine.serialNumber} · firmware ${machine.firmwareVersion}`
                    : machine.serialNumber
                }
              />
              <SiteRequirements
                spec={machine.spec}
                specSheetHref={`/organizers/${slug}/shows/${eventId}/machines/${machineId}/spec`}
              />
            </div>
          </section>
        </>
      )}
    </PortalPageShell>
  );
}
