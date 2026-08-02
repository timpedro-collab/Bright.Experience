"use client";

/**
 * Live fleet view for the organizer Show Command page.
 *
 * Polls the same endpoint as the internal live dashboard but renders only
 * what an organizer acts on: fleet totals and per-machine health by zone.
 * No lead-level detail appears here — captured contacts belong to the brand
 * running the activation, not the show host.
 */

import { useState, useEffect, useCallback } from "react";
import { Activity, Users, Gift, RefreshCw, Cpu } from "lucide-react";

import { FleetBoard } from "@/components/telemetry/FleetBoard";
import { StatCard } from "@/components/ui/stat-card";
import { EmptyState } from "@/components/ui/EmptyState";
import { EditorialEyebrow } from "@/components/brand";
import { cn } from "@/lib/utils";
import {
  fleetTotals,
  groupBreakdownByZone,
  type MachineBreakdown,
} from "@/lib/metrics/fleet";

const POLL_INTERVAL_MS = 15_000;

interface FleetLiveClientProps {
  eventId: string;
  initialBreakdown: MachineBreakdown[];
  /**
   * Base path for a unit's own page — a string rather than a callback
   * because this is a client boundary and functions don't cross it.
   */
  machineHrefBase: string;
  /**
   * False when the show isn't open. Units sitting in a warehouse aren't
   * "offline", so the panel stops polling, drops the live chrome, and reports
   * readiness (zone and job set) instead of signal.
   */
  isLive?: boolean;
  /** What to say instead of "Live" when the show isn't running. */
  dormantLabel?: string;
}

export function FleetLiveClient({
  eventId,
  initialBreakdown,
  machineHrefBase,
  isLive = true,
  dormantLabel = "Not running",
}: FleetLiveClientProps) {
  const [breakdown, setBreakdown] = useState<MachineBreakdown[]>(initialBreakdown);
  const [isPolling, setIsPolling] = useState(isLive);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/events/${eventId}/live`, { cache: "no-store" });
      if (!res.ok) return;
      const data: { machine_breakdown?: MachineBreakdown[] } = await res.json();
      // Cloud-sourced snapshots carry no per-machine split yet, so an empty
      // array means "no fresh detail" rather than "the fleet vanished".
      if (data.machine_breakdown && data.machine_breakdown.length > 0) {
        setBreakdown(data.machine_breakdown);
      }
    } catch {
      /* network hiccup — retry on next tick */
    }
  }, [eventId]);

  useEffect(() => {
    if (!isPolling) return;
    const id = setInterval(fetchData, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [fetchData, isPolling]);

  const totals = fleetTotals(breakdown);
  const ready = breakdown.filter((m) => m.zone && m.mission).length;

  return (
    <div className="space-y-6">
      <div>
        <div className="mb-4 flex items-center justify-between">
          <EditorialEyebrow accent={isLive}>
            {isLive ? "Right now" : "Readiness"}
          </EditorialEyebrow>
          {isLive ? (
            <button
              onClick={() => setIsPolling((p) => !p)}
              className={cn(
                "flex items-center gap-1.5 text-xs transition-colors",
                isPolling ? "text-success" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <RefreshCw
                size={12}
                className={isPolling ? "animate-spin" : ""}
                style={isPolling ? { animationDuration: "3s" } : undefined}
              />
              {isPolling ? "Live" : "Paused"}
            </button>
          ) : (
            <span className="text-xs text-muted-foreground">{dormantLabel}</span>
          )}
        </div>
        {isLive ? (
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard
              label="Machines online"
              value={`${totals.online}/${totals.machines}`}
              icon={Cpu}
              tone={totals.online < totals.machines ? "warning" : "success"}
              hint={
                totals.online < totals.machines
                  ? `${totals.machines - totals.online} not reporting in`
                  : "Whole fleet reporting in"
              }
              animate={false}
            />
            <StatCard label="Plays" value={totals.plays} icon={Activity} animate={false} />
            <StatCard
              label="Leads"
              value={totals.leads}
              icon={Users}
              hint={
                totals.plays > 0
                  ? `${Math.round((totals.leads / totals.plays) * 100)}% of plays opted in`
                  : undefined
              }
              animate={false}
            />
            <StatCard label="Prizes" value={totals.prizes} icon={Gift} animate={false} />
          </div>
        ) : (
          // Three zeroed counters tell an organizer nothing about a show that
          // hasn't opened. Readiness plus a line about what lands here later
          // is the honest version.
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            <StatCard
              label="Ready to go"
              value={`${ready}/${totals.machines}`}
              icon={Cpu}
              tone={ready < totals.machines ? "warning" : "success"}
              hint={
                ready < totals.machines
                  ? `${totals.machines - ready} still need a zone or a job`
                  : "Every unit has a zone and a job"
              }
              animate={false}
            />
            <div className="flex items-center rounded-[var(--radius-card)] border border-dashed border-border bg-card/40 p-5">
              <p className="text-xs text-muted-foreground">
                Plays, leads and prizes appear here the moment the doors open,
                per machine and per zone, and update on their own.
              </p>
            </div>
          </div>
        )}
      </div>

      <div>
        <div className="mb-4 flex items-baseline justify-between gap-3">
          <EditorialEyebrow>By machine</EditorialEyebrow>
          <p className="text-xs text-muted-foreground">
            Open a unit to set its zone, mission and sponsor.
          </p>
        </div>
        <FleetBoard
          zones={groupBreakdownByZone(breakdown)}
          breakdown={breakdown}
          isCustomer
          machineHref={(id) => `${machineHrefBase}/${id}`}
          mode={isLive ? "live" : "prep"}
          emptyState={
            <EmptyState
              icon={Cpu}
              title="Your fleet on this show"
              description="Each assigned unit appears here by zone with live health once the doors open. Bright.Blue allocates hardware when dates and placement are agreed — none are assigned to this show yet."
              size="sm"
              tone="flat"
            />
          }
        />
      </div>
    </div>
  );
}
