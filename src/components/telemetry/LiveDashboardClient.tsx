/**
 * Client-side live dashboard — polls /api/events/:id/live every 10 seconds
 * and renders real-time counters, hourly chart, feed, and machine status.
 *
 * Initial data is SSR'd; this component takes over for auto-refresh.
 */
"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Activity, Users, Gift, Clock, RefreshCw, X } from "lucide-react";

import { LiveCounter } from "./LiveCounter";
import { HourlyChart } from "./HourlyChart";
import { LiveFeed } from "./LiveFeed";
import { MachineStatusCard } from "./MachineStatusCard";
import { StockCard } from "./StockCard";
import { FleetBoard } from "./FleetBoard";
import type { MachineBreakdown, ZoneBreakdown } from "@/lib/metrics/fleet";
import { EditorialEyebrow, Hairline } from "@/components/brand";
import { EmptyState } from "@/components/ui/EmptyState";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Radio } from "lucide-react";

const POLL_INTERVAL_MS = 10_000;

interface Metrics {
  total_plays: number;
  total_leads: number;
  total_interactions: number;
  total_prizes: number;
  avg_dwell_time: number;
  stock_remaining?: number | null;
  stock_capacity?: number | null;
  reload_eta_minutes?: number | null;
}

interface HourlyPoint {
  hour: number;
  plays: number;
  leads: number;
}

interface FeedItem {
  id: string;
  type: string;
  message: string;
  timestamp: string;
  machineInstanceId?: string | null;
}

interface MachineInfo {
  id?: string;
  serial_number: string;
  nickname?: string;
  status: string;
  last_heartbeat?: string;
  firmware_version?: string;
}

interface LiveData {
  source: string;
  metrics: Metrics;
  hourly: HourlyPoint[];
  machines: MachineInfo[];
  machine_breakdown?: MachineBreakdown[];
  zones?: ZoneBreakdown[];
  feed: FeedItem[];
}

interface LiveDashboardClientProps {
  eventId: string;
  initialMetrics: Metrics;
  initialHourly: HourlyPoint[];
  initialFeed: FeedItem[];
  initialMachines: MachineInfo[];
  isCustomer?: boolean;
}

export function LiveDashboardClient({
  eventId,
  initialMetrics,
  initialHourly,
  initialFeed,
  initialMachines,
  isCustomer = false,
}: LiveDashboardClientProps) {
  const [metrics, setMetrics] = useState<Metrics>(initialMetrics);
  const [hourly, setHourly] = useState<HourlyPoint[]>(initialHourly);
  const [feed, setFeed] = useState<FeedItem[]>(initialFeed);
  const [machines, setMachines] = useState<MachineInfo[]>(initialMachines);
  // Populated by the first poll; the SSR seed has no per-machine split.
  const [breakdown, setBreakdown] = useState<MachineBreakdown[]>([]);
  const [zones, setZones] = useState<ZoneBreakdown[]>([]);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [isPolling, setIsPolling] = useState(true);
  const [source, setSource] = useState<string>("local");
  const [selectedMachineId, setSelectedMachineId] = useState<string | null>(null);

  const selectMachine = useCallback((machineId: string) => {
    setSelectedMachineId((prev) => (prev === machineId ? null : machineId));
    requestAnimationFrame(() => {
      document.getElementById("live-feed")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, []);

  const selectedMachineLabel = useMemo(() => {
    if (!selectedMachineId) return null;
    const fromBreakdown = breakdown.find((m) => m.machine_instance_id === selectedMachineId);
    if (fromBreakdown) {
      if (fromBreakdown.nickname) return fromBreakdown.nickname;
      if (isCustomer) {
        return fromBreakdown.zone ? `${fromBreakdown.zone} unit` : "Activation unit";
      }
      return fromBreakdown.serial_number;
    }
    const fromMachines = machines.find((m) => m.id === selectedMachineId);
    if (fromMachines) {
      return fromMachines.nickname ?? (isCustomer ? "Activation unit" : fromMachines.serial_number);
    }
    return "Selected machine";
  }, [selectedMachineId, breakdown, machines, isCustomer]);

  // 1-second tick so "Updated Ns ago" stays honest between polls.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const secondsAgo = Math.max(0, Math.floor((now - lastRefresh.getTime()) / 1000));
  const freshness =
    secondsAgo < 5
      ? "Updated just now"
      : secondsAgo < 60
        ? `Updated ${secondsAgo}s ago`
        : `Updated ${Math.floor(secondsAgo / 60)}m ago`;

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/events/${eventId}/live`, {
        cache: "no-store",
      });
      if (!res.ok) return;
      const data: LiveData = await res.json();
      setMetrics(data.metrics);
      setHourly(data.hourly);
      if (data.feed.length > 0) setFeed(data.feed);
      setMachines(data.machines);
      setBreakdown(data.machine_breakdown ?? []);
      setZones(data.zones ?? []);
      setSource(data.source);
      setLastRefresh(new Date());
    } catch {
      /* network hiccup — retry on next tick */
    }
  }, [eventId]);

  useEffect(() => {
    // Refresh immediately on mount so the chart, feed and machine status fill
    // right away (the SSR snapshot seeds an empty hourly curve), then keep the
    // dashboard current on the polling interval. The first call is deferred a
    // tick so we don't trigger a synchronous setState inside the effect body.
    const kickoff = setTimeout(fetchData, 0);
    const id = isPolling ? setInterval(fetchData, POLL_INTERVAL_MS) : undefined;
    return () => {
      clearTimeout(kickoff);
      if (id) clearInterval(id);
    };
  }, [fetchData, isPolling]);

  const allZero =
    metrics.total_plays === 0 &&
    metrics.total_leads === 0 &&
    metrics.total_interactions === 0 &&
    metrics.total_prizes === 0;
  const noMachinesConnected =
    machines.length === 0 ||
    machines.every((m) => m.status === "offline" || m.status === "disconnected");
  const showWaiting = allZero && noMachinesConnected;

  return (
    <>
      {showWaiting && (
        <section className="py-8">
          <EmptyState
            icon={Radio}
            title="Waiting for your activation"
            description="Waiting for your activation to go live. Metrics will appear here automatically once the machines are connected."
            tone="flat"
            size="sm"
          />
        </section>
      )}

      <section className="py-8">
        <div className="flex items-center justify-between mb-4">
          <EditorialEyebrow accent>Right now</EditorialEyebrow>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsPolling((p) => !p)}
              className={cn(
                "flex items-center gap-1.5 text-xs transition-colors",
                isPolling
                  ? "text-success"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <RefreshCw
                size={12}
                className={isPolling ? "animate-spin" : ""}
                style={isPolling ? { animationDuration: "3s" } : undefined}
              />
              {isPolling ? "Live" : "Paused"}
            </button>
            {source === "cloud" && (
              <Badge variant="outline" className="text-[0.6rem] gap-1">
                <span className="size-1.5 rounded-full bg-cyan-400" />
                Cloud
              </Badge>
            )}
            <span className="text-xs text-muted-foreground tabular-nums">
              {freshness}
            </span>
          </div>
        </div>
        {/* Screen readers hear the totals once per poll, not every tick. */}
        <p aria-live="polite" className="sr-only">
          {`Live totals: ${metrics.total_plays} plays, ${metrics.total_leads} leads, ${metrics.total_prizes} prizes won.`}
        </p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <LiveCounter
            label="Total plays"
            value={metrics.total_plays}
            icon={<Activity size={20} />}
          />
          <LiveCounter
            label="Total leads"
            value={metrics.total_leads}
            icon={<Users size={20} />}
          />
          <LiveCounter
            label="Prizes won"
            value={metrics.total_prizes}
            icon={<Gift size={20} />}
          />
          <LiveCounter
            label="Avg dwell time"
            value={Math.round(metrics.avg_dwell_time)}
            suffix="s"
            icon={<Clock size={20} />}
          />
        </div>
        {metrics.stock_remaining != null && metrics.stock_capacity != null && (
          <div className="mt-4">
            <StockCard
              remaining={metrics.stock_remaining}
              capacity={metrics.stock_capacity}
              reloadEtaMinutes={metrics.reload_eta_minutes ?? null}
            />
          </div>
        )}
      </section>

      {/* A single-machine activation says everything it needs to in the
          machine-status cards below; the fleet board is for multi-unit shows. */}
      {breakdown.length > 1 && (
        <>
          <Hairline className="opacity-60" />
          <section className="py-8">
            <EditorialEyebrow>By machine</EditorialEyebrow>
            <div className="mt-4">
              <FleetBoard
                zones={zones}
                breakdown={breakdown}
                isCustomer={isCustomer}
                onMachineSelect={(machine) => selectMachine(machine.machine_instance_id)}
                selectedMachineId={selectedMachineId}
              />
            </div>
          </section>
        </>
      )}

      <Hairline className="opacity-60" />

      <section className="py-8">
        <EditorialEyebrow>By the hour</EditorialEyebrow>
        <div className="mt-4">
          <HourlyChart data={hourly} />
        </div>
      </section>

      <Hairline className="opacity-60" />

      <section className="py-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <EditorialEyebrow>Live feed</EditorialEyebrow>
            {selectedMachineId && selectedMachineLabel && (
              <Badge variant="outline" className="gap-1.5 text-xs font-normal">
                Showing: {selectedMachineLabel}
                <button
                  type="button"
                  onClick={() => setSelectedMachineId(null)}
                  className="ml-0.5 inline-flex items-center rounded-sm p-0.5 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label="Clear machine filter"
                >
                  <X size={12} />
                </button>
              </Badge>
            )}
          </div>
          <div className="mt-4">
            <LiveFeed items={feed} machineFilter={selectedMachineId} />
          </div>
        </div>
        <div>
          <EditorialEyebrow>Machine status</EditorialEyebrow>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {machines.length === 0 ? (
              <p className="text-sm text-muted-foreground col-span-2 py-6">
                No machines assigned
              </p>
            ) : (
              machines.map((m) => (
                <MachineStatusCard
                  key={m.serial_number}
                  isCustomer={isCustomer}
                  onSelect={m.id ? () => selectMachine(m.id!) : undefined}
                  isSelected={Boolean(m.id && selectedMachineId === m.id)}
                  machine={{
                    id: m.id,
                    serialNumber: m.serial_number,
                    nickname: m.nickname,
                    status: m.status,
                    lastHeartbeat: m.last_heartbeat,
                    firmwareVersion: m.firmware_version,
                  }}
                />
              ))
            )}
          </div>
        </div>
      </section>
    </>
  );
}
