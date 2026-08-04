/**
 * Show Command — the organizer's single view of one show.
 *
 * Opens with the state of the show (fleet, zones, inventory, what needs a
 * decision), then the live fleet by zone, then the sponsor inventory sold
 * against it. Every unit links to its own page. Deliberately excludes
 * lead-level data: captured contacts belong to the brand that ran the
 * activation, not the show host.
 *
 * Before the doors open it leads with the run-up instead: the dated spine of
 * the show and a readiness board naming what each unit still needs. The
 * delivery team's own task list is *not* surfaced here — an organizer hosting
 * a brand's activation has no business reading that brand's internal delivery
 * plan, and RLS reflects that. What they can act on is derived from the
 * machines, configurations and slots they already own.
 */
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  Handshake,
  ArrowRight,
  Cpu,
  MapPin,
  Wallet,
  TicketPercent,
} from "lucide-react";

import { PortalPageShell, organizerTabs, organizerRoleLabel } from "@/components/brand";
import { EditorialEyebrow, Hairline } from "@/components/brand";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/ui/stat-card";
import { EmptyState } from "@/components/ui/EmptyState";
import { FleetLiveClient } from "@/components/organizers/FleetLiveClient";
import { KeyDates } from "@/components/organizers/KeyDates";
import { ShowReadinessBoard } from "@/components/organizers/ShowReadinessBoard";
import { SlotStatusBadge } from "@/components/organizers/SlotStatusBadge";
import { SlotCreativePicker } from "@/components/organizers/SlotCreativePicker";
import { SlotMachineSelect } from "@/components/organizers/SlotMachineSelect";
import { PitchLinkControls } from "@/components/organizers/PitchLinkControls";
import {
  NewShowSlotForm,
  type SlotMachineOption,
} from "@/components/organizers/NewShowSlotForm";

import { requireOrganizerContext } from "@/lib/auth/organizer-portal";
import {
  getOrganizerShow,
  getFleetBreakdownForShow,
  getSlotsByEvent,
  getShowCreativeOptions,
} from "@/lib/queries/organizers";
import { getUnreadCount } from "@/lib/queries/notifications";
import {
  getGameConfigurations,
  getProductConfigurations,
} from "@/app/actions/game-config";
import { formatDateShort } from "@/lib/dates";
import { formatMoneyFromPence } from "@/lib/currency";
import { missionLabel } from "@/lib/fleet-labels";
import { fleetTotals } from "@/lib/metrics/fleet";
import { showRunState } from "@/lib/metrics/organizer-portfolio";
import {
  showReadinessRows,
  type CreativeReviewIndex,
} from "@/lib/metrics/show-readiness";
import {
  buildShowSchedule,
  countdownLabel,
  daysToDoors,
} from "@/lib/metrics/show-schedule";
import type { MachineMission } from "@/types";

interface Props {
  params: Promise<{ slug: string; eventId: string }>;
}

function firstRelation(value: unknown): Record<string, unknown> | null {
  if (Array.isArray(value)) return (value[0] as Record<string, unknown>) ?? null;
  return (value as Record<string, unknown>) ?? null;
}

export default async function ShowCommandPage({ params }: Props) {
  const { slug, eventId } = await params;
  const { user, partnerId, partnerName } = await requireOrganizerContext(slug);

  const show = await getOrganizerShow(eventId, partnerId);
  if (!show) return notFound();

  const [
    breakdown,
    slots,
    creativeOptions,
    gameConfigs,
    productConfigs,
    unread,
  ] = await Promise.all([
    getFleetBreakdownForShow(eventId),
    getSlotsByEvent(eventId),
    getShowCreativeOptions(eventId),
    getGameConfigurations(eventId),
    getProductConfigurations(eventId),
    getUnreadCount(user.id),
  ]);

  const totals = fleetTotals(breakdown);
  const soldSlots = slots.filter((s) => s.status !== "available");
  const soldValue = soldSlots.reduce((sum, s) => sum + (Number(s.price) || 0), 0);
  const openSlots = slots.filter((s) => s.status === "available");
  const openValue = openSlots.reduce((sum, s) => sum + (Number(s.price) || 0), 0);
  const zoneCount = new Set(
    breakdown.map((m) => m.zone ?? "Unassigned")
  ).size;
  const unassigned = breakdown.filter((m) => !m.zone || !m.mission).length;

  // Slot counts per machine, so the "open a slot" picker can flag units that
  // already carry one.
  const slotsPerMachine = new Map<string, number>();
  for (const slot of slots) {
    const id = slot.machine_instance_id ? String(slot.machine_instance_id) : null;
    if (id) slotsPerMachine.set(id, (slotsPerMachine.get(id) ?? 0) + 1);
  }

  const machineOptions: SlotMachineOption[] = breakdown.map((m) => ({
    id: m.machine_instance_id,
    label: m.nickname ?? m.serial_number,
    zone: m.zone,
    mission: m.mission,
    slotCount: slotsPerMachine.get(m.machine_instance_id) ?? 0,
  }));

  const machineBase = `/organizers/${slug}/shows/${eventId}/machines`;
  const dateLine = `${formatDateShort(String(show.event_date_start))}${
    show.event_date_end ? ` – ${formatDateShort(String(show.event_date_end))}` : ""
  }`;

  const runState = showRunState(
    String(show.event_date_start),
    show.event_date_end ? String(show.event_date_end) : null
  );
  const isLive = runState === "running" || show.current_stage === "event_live";
  const isUpcoming = runState === "upcoming" && !isLive;
  const dormantLabel =
    runState === "upcoming"
      ? `Opens ${formatDateShort(String(show.event_date_start))}`
      : "Show has finished";
  const daysAway = daysToDoors(String(show.event_date_start));

  const schedule = buildShowSchedule({
    setupDate: show.setup_date ? String(show.setup_date) : null,
    startDate: String(show.event_date_start),
    endDate: show.event_date_end ? String(show.event_date_end) : null,
    collectionDate: show.collection_date ? String(show.collection_date) : null,
  });

  // Review status by asset id, so readiness can tell attached artwork from
  // approved artwork without a second round trip per slot.
  const creativeReview: CreativeReviewIndex = Object.fromEntries(
    creativeOptions.map((option) => [option.id, option.reviewStatus])
  );

  const readinessRows = showReadinessRows(
    breakdown.map((m) => ({
      id: m.machine_instance_id,
      label: m.nickname ?? m.serial_number,
      zone: m.zone,
      mission: m.mission,
    })),
    {
      gameConfigs,
      productConfigs,
      slots: slots.map((slot) => ({
        machineInstanceId: slot.machine_instance_id
          ? String(slot.machine_instance_id)
          : null,
        sponsorName: slot.sponsor_name ? String(slot.sponsor_name) : null,
        status: String(slot.status),
        creativeAssetIds: Array.isArray(slot.creative_asset_ids)
          ? (slot.creative_asset_ids as string[])
          : [],
      })),
      creativeReview,
    }
  );

  return (
    <PortalPageShell
      user={user}
      roleLabel={organizerRoleLabel(user.role)}
      unreadCount={unread}
      scope={partnerName}
      section={String(show.name)}
      slug={slug}
      tabs={organizerTabs(slug)}
      title={String(show.name)}
      subtitle={`${dateLine}${show.venue_name ? ` · ${show.venue_name}` : ""}`}
      backHref={`/organizers/${slug}/shows`}
      backLabel="Back to shows"
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: partnerName, href: `/organizers/${slug}/shows` },
        { label: String(show.name) },
      ]}
      heroRight={
        <Badge variant={isLive ? "default" : "outline"}>
          {isLive
            ? "Running now"
            : isUpcoming
              ? countdownLabel(daysAway)
              : dormantLabel}
        </Badge>
      }
    >
      <section>
        <EditorialEyebrow>This show</EditorialEyebrow>
        <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard
            label="Machines"
            value={totals.machines}
            icon={Cpu}
            hint={`Across ${zoneCount} zone${zoneCount === 1 ? "" : "s"}`}
          />
          <StatCard
            label="Needs setting up"
            value={unassigned}
            icon={MapPin}
            tone={unassigned > 0 ? "warning" : "success"}
            hint={
              unassigned > 0
                ? "Units missing a zone or a mission"
                : "Every unit has a zone and a job"
            }
          />
          <StatCard
            label="Sold"
            value={slots.length > 0 ? formatMoneyFromPence(soldValue) : "—"}
            icon={Wallet}
            hint={
              slots.length > 0
                ? `${soldSlots.length} of ${slots.length} slot${
                    slots.length === 1 ? "" : "s"
                  } taken`
                : "Nothing opened as inventory yet"
            }
          />
          <StatCard
            label="Still available"
            value={openSlots.length > 0 ? formatMoneyFromPence(openValue) : "—"}
            icon={TicketPercent}
            tone={openSlots.length > 0 ? "info" : "default"}
            hint={
              openSlots.length > 0
                ? `${openSlots.length} slot${openSlots.length === 1 ? "" : "s"} to sell`
                : slots.length > 0
                  ? "Every slot is taken"
                  : "Open a unit below to start selling"
            }
          />
        </div>
      </section>

      <Hairline className="my-8 opacity-60" />

      <section>
        <EditorialEyebrow>
          {isUpcoming ? "The run-up" : "Key dates"}
        </EditorialEyebrow>
        <div className="mt-4 space-y-6">
          <KeyDates entries={schedule} />
          {isUpcoming && (
            <ShowReadinessBoard
              rows={readinessRows}
              machineHrefBase={machineBase}
              timingHint={countdownLabel(daysAway)}
            />
          )}
        </div>
      </section>

      <Hairline className="my-8 opacity-60" />

      <FleetLiveClient
        eventId={eventId}
        initialBreakdown={breakdown}
        machineHrefBase={machineBase}
        isLive={isLive}
        dormantLabel={dormantLabel}
      />

      <Hairline className="my-8 opacity-60" />

      <section id="inventory" className="scroll-mt-24">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <EditorialEyebrow>Sponsor inventory</EditorialEyebrow>
          <div className="flex items-center gap-3">
            <NewShowSlotForm
              eventId={eventId}
              machines={machineOptions}
              defaultStartDate={String(show.event_date_start)}
              defaultEndDate={String(
                show.event_date_end ?? show.event_date_start
              )}
            />
            <Link
              href={`/organizers/${slug}/sponsors`}
              className="inline-flex items-center gap-1 text-xs font-medium text-[var(--color-bb-cobalt)] hover:underline"
            >
              All shows <ArrowRight size={12} />
            </Link>
          </div>
        </div>

        {slots.length === 0 ? (
          <EmptyState
            icon={Handshake}
            title="Sponsor inventory"
            description="Each open slot gets its own pitch page and post-show report. No machines have been opened as inventory on this show yet — use Open Slot above to start selling."
            size="sm"
            tone="flat"
          />
        ) : (
          <Card>
            <CardContent className="p-0">
              <ul className="divide-y divide-border/50">
                {slots.map((slot) => {
                  const machine = firstRelation(slot.machine_instances);
                  const machineId = slot.machine_instance_id
                    ? String(slot.machine_instance_id)
                    : null;
                  return (
                    <li
                      key={String(slot.id)}
                      className="flex flex-wrap items-start justify-between gap-4 px-5 py-4"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-sm font-medium text-foreground">
                            {slot.sponsor_name
                              ? String(slot.sponsor_name)
                              : "Open slot"}
                          </p>
                          <SlotStatusBadge status={String(slot.status)} />
                        </div>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {machineId ? (
                            <Link
                              href={`${machineBase}/${machineId}`}
                              className="hover:text-foreground hover:underline"
                            >
                              {machine?.nickname
                                ? String(machine.nickname)
                                : String(machine?.serial_number ?? "This unit")}
                            </Link>
                          ) : (
                            "No machine assigned"
                          )}
                          {machine?.zone ? ` · ${String(machine.zone)}` : ""}
                          {machine?.mission
                            ? ` · ${missionLabel(machine.mission as MachineMission)}`
                            : ""}
                          {" · "}
                          {formatDateShort(String(slot.start_date))} –{" "}
                          {formatDateShort(String(slot.end_date))}
                        </p>
                        <div className="mt-2 flex flex-wrap items-center gap-3">
                          <SlotMachineSelect
                            slotId={String(slot.id)}
                            currentMachineId={machineId}
                            machines={machineOptions}
                          />
                          <SlotCreativePicker
                            slotId={String(slot.id)}
                            attachedIds={
                              Array.isArray(slot.creative_asset_ids)
                                ? (slot.creative_asset_ids as string[])
                                : []
                            }
                            options={creativeOptions}
                          />
                        </div>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-sm font-semibold tabular-nums text-foreground">
                          {slot.price
                            ? formatMoneyFromPence(Number(slot.price))
                            : "—"}
                        </p>
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
                          viewCount={Number(slot.pitch_view_count) || 0}
                          lastViewedAt={
                            slot.pitch_last_viewed_at
                              ? String(slot.pitch_last_viewed_at)
                              : null
                          }
                          className="mt-2"
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
            </CardContent>
          </Card>
        )}
      </section>
    </PortalPageShell>
  );
}
