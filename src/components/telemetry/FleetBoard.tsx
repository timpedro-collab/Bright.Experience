"use client";

/**
 * Fleet board — per-machine performance grouped by zone.
 *
 * Shown when a show runs more than one machine. The ordering is deliberate:
 * anything needing attention comes first, because the question an operator
 * walks in with is "what's broken", not "what's the total".
 */

import Link from "next/link";
import { AlertTriangle, ChevronRight, MapPin, Wifi, WifiOff } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useStableStatus } from "@/hooks/useStableStatus";
import { missionLabel } from "@/lib/fleet-labels";
import {
  machinesNeedingAttention,
  machinesNeedingSetup,
  setupGapLabel,
  type MachineBreakdown,
  type ZoneBreakdown,
} from "@/lib/metrics/fleet";

interface FleetBoardProps {
  zones: ZoneBreakdown[];
  breakdown: MachineBreakdown[];
  /** Customers and organizers see friendly labels, not hardware serials. */
  isCustomer?: boolean;
  /**
   * Makes each unit a link to its own page. Omitted where no such page
   * exists for the viewer, in which case rows stay plain text.
   */
  machineHref?: (machineInstanceId: string) => string;
  /** Filters the live feed to one machine instead of navigating away. */
  onMachineSelect?: (machine: MachineBreakdown) => void;
  selectedMachineId?: string | null;
  /**
   * "live" judges units on signal and plays; "prep" judges them on whether
   * they're placed and have a job. A show that opens in December has no
   * telemetry to be missing, so calling its fleet offline is noise.
   */
  mode?: "live" | "prep";
  /**
   * What to show when the fleet is empty. The default is a bare statement,
   * which is right for an internal viewer who already knows how a machine gets
   * allocated; an organizer being told "no machines" without being told who
   * arranges them has nowhere to go.
   */
  emptyState?: React.ReactNode;
}

function machineTitle(machine: MachineBreakdown, isCustomer: boolean): string {
  if (machine.nickname) return machine.nickname;
  if (isCustomer) return machine.zone ? `${machine.zone} unit` : "Activation unit";
  return machine.serial_number;
}

function MachineRow({
  machine,
  isCustomer,
  href,
  onSelect,
  isSelected,
  mode,
}: {
  machine: MachineBreakdown;
  isCustomer: boolean;
  href?: string;
  onSelect?: () => void;
  isSelected?: boolean;
  mode: "live" | "prep";
}) {
  const isPrep = mode === "prep";
  const stableOnline = useStableStatus(machine.is_online);
  const body = (
    <>
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          {isPrep ? (
            <MapPin size={12} className="shrink-0 text-muted-foreground" />
          ) : stableOnline ? (
            <Wifi size={12} className="shrink-0 text-success" />
          ) : (
            <WifiOff size={12} className="shrink-0 text-muted-foreground" />
          )}
          <p className="truncate text-sm font-medium text-foreground">
            {machineTitle(machine, isCustomer)}
          </p>
        </div>
        <p className="mt-0.5 pl-5 text-xs text-muted-foreground">
          {missionLabel(machine.mission)}
          {!isCustomer && machine.nickname ? ` · ${machine.serial_number}` : ""}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-4 text-right tabular-nums">
        {isPrep ? (
          <p className="text-xs text-muted-foreground">
            {machine.zone?.trim() && machine.mission
              ? "Ready"
              : setupGapLabel(machine)}
          </p>
        ) : (
          <>
            <div>
              <p className="text-sm font-semibold text-foreground">{machine.plays}</p>
              <p className="text-[0.65rem] uppercase tracking-wide text-muted-foreground">
                Plays
              </p>
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">{machine.leads}</p>
              <p className="text-[0.65rem] uppercase tracking-wide text-muted-foreground">
                Leads
              </p>
            </div>
          </>
        )}
        {href && (
          <ChevronRight
            size={14}
            className="text-muted-foreground/60 transition-colors group-hover:text-foreground"
          />
        )}
      </div>
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="group -mx-2 flex items-center justify-between gap-4 rounded-lg px-2 py-3 transition-colors hover:bg-foreground/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {body}
      </Link>
    );
  }

  if (onSelect) {
    return (
      <button
        type="button"
        onClick={onSelect}
        aria-pressed={isSelected}
        className={cn(
          "group -mx-2 flex w-full items-center justify-between gap-4 rounded-lg px-2 py-3 text-left transition-colors hover:bg-foreground/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          isSelected && "bg-brand/5 ring-1 ring-brand/30"
        )}
      >
        {body}
      </button>
    );
  }

  return (
    <div className="flex items-center justify-between gap-4 py-3">{body}</div>
  );
}

/** Zone health: signal while the show runs, readiness before it opens. */
function ZoneBadge({ zone, isPrep }: { zone: ZoneBreakdown; isPrep: boolean }) {
  const total = zone.machines.length;
  const ready = zone.machines.filter((m) => m.zone?.trim() && m.mission).length;
  const rawGood = isPrep ? ready === total : zone.offline_count === 0;
  const good = useStableStatus(rawGood);
  const count = isPrep ? ready : total - zone.offline_count;

  return (
    <Badge
      className={cn(
        "shrink-0 border-0 text-[0.65rem]",
        good ? "bg-success/10 text-success" : "bg-warning/10 text-warning"
      )}
    >
      {count}/{total} {isPrep ? "set up" : "online"}
    </Badge>
  );
}

export function FleetBoard({
  zones,
  breakdown,
  isCustomer = false,
  machineHref,
  onMachineSelect,
  selectedMachineId = null,
  mode = "live",
  emptyState,
}: FleetBoardProps) {
  const isPrep = mode === "prep";
  const rawAttentionKey = (isPrep
    ? machinesNeedingSetup(breakdown)
    : machinesNeedingAttention(breakdown)
  )
    .map((m) => m.machine_instance_id)
    .sort()
    .join(",");
  // Attention banner visibility follows threshold-derived online — debounce the set.
  const stableAttentionKey = useStableStatus(rawAttentionKey, isPrep ? 1 : 2);
  const attention = stableAttentionKey
    ? breakdown.filter((m) => stableAttentionKey.split(",").includes(m.machine_instance_id))
    : [];

  if (breakdown.length === 0) {
    return (
      <>
        {emptyState ?? (
          <p className="py-6 text-sm text-muted-foreground">
            No machines assigned yet.
          </p>
        )}
      </>
    );
  }

  return (
    <div className="space-y-4">
      {attention.length > 0 && (
        <Card className="border-warning/30 bg-warning/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle size={14} className="text-warning" />
              <p className="text-sm font-medium text-foreground">
                {attention.length} {attention.length === 1 ? "machine needs" : "machines need"}{" "}
                {isPrep ? "setting up" : "attention"}
              </p>
            </div>
            <ul className="mt-2 space-y-1 pl-6">
              {attention.map((machine) => {
                const reason = isPrep
                  ? setupGapLabel(machine)
                  : !machine.is_online
                    ? "no signal"
                    : "no plays yet";
                const label = `${machineTitle(machine, isCustomer)}${
                  machine.zone ? ` (${machine.zone})` : ""
                } — ${reason}`;
                const href = machineHref?.(machine.machine_instance_id);
                const canSelect = Boolean(onMachineSelect);
                return (
                  <li
                    key={machine.machine_instance_id}
                    className="text-xs text-muted-foreground"
                  >
                    {href ? (
                      <Link href={href} className="hover:text-foreground hover:underline">
                        {label}
                      </Link>
                    ) : canSelect ? (
                      <button
                        type="button"
                        onClick={() => onMachineSelect?.(machine)}
                        className="hover:text-foreground hover:underline"
                      >
                        {label}
                      </button>
                    ) : (
                      label
                    )}
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {zones.map((zone) => (
          <Card key={zone.zone} className="border-glass-border bg-surface-glass backdrop-blur-sm">
            <CardContent className="p-5">
              <div className="flex items-baseline justify-between gap-3">
                <p className="text-heading truncate text-sm font-semibold text-foreground">
                  {zone.zone}
                </p>
                <ZoneBadge zone={zone} isPrep={isPrep} />
              </div>
              <p className="mt-1 text-xs text-muted-foreground tabular-nums">
                {isPrep
                  ? `${zone.machines.length} machine${
                      zone.machines.length === 1 ? "" : "s"
                    } placed here`
                  : `${zone.plays} plays · ${zone.leads} leads · ${zone.prizes} prizes`}
              </p>
              <div className="mt-2 divide-y divide-border/60">
                {zone.machines.map((machine) => (
                  <MachineRow
                    key={machine.machine_instance_id}
                    machine={machine}
                    isCustomer={isCustomer}
                    href={machineHref?.(machine.machine_instance_id)}
                    onSelect={
                      onMachineSelect
                        ? () => onMachineSelect(machine)
                        : undefined
                    }
                    isSelected={selectedMachineId === machine.machine_instance_id}
                    mode={mode}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
