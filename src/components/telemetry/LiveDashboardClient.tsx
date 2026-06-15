/**
 * Client-side live dashboard — polls /api/events/:id/live every 10 seconds
 * and renders real-time counters, hourly chart, feed, and machine status.
 *
 * Initial data is SSR'd; this component takes over for auto-refresh.
 */
"use client";

import { useState, useEffect, useCallback } from "react";
import { Activity, Users, Gift, Clock, RefreshCw } from "lucide-react";

import { LiveCounter } from "./LiveCounter";
import { HourlyChart } from "./HourlyChart";
import { LiveFeed } from "./LiveFeed";
import { MachineStatusCard } from "./MachineStatusCard";
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
}

interface MachineInfo {
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
  feed: FeedItem[];
}

interface LiveDashboardClientProps {
  eventId: string;
  initialMetrics: Metrics;
  initialHourly: HourlyPoint[];
  initialFeed: FeedItem[];
  initialMachines: MachineInfo[];
}

export function LiveDashboardClient({
  eventId,
  initialMetrics,
  initialHourly,
  initialFeed,
  initialMachines,
}: LiveDashboardClientProps) {
  const [metrics, setMetrics] = useState<Metrics>(initialMetrics);
  const [hourly, setHourly] = useState<HourlyPoint[]>(initialHourly);
  const [feed, setFeed] = useState<FeedItem[]>(initialFeed);
  const [machines, setMachines] = useState<MachineInfo[]>(initialMachines);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [isPolling, setIsPolling] = useState(true);
  const [source, setSource] = useState<string>("local");

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
      setSource(data.source);
      setLastRefresh(new Date());
    } catch {
      /* network hiccup — retry on next tick */
    }
  }, [eventId]);

  useEffect(() => {
    if (!isPolling) return;
    const id = setInterval(fetchData, POLL_INTERVAL_MS);
    return () => clearInterval(id);
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
              {lastRefresh.toLocaleTimeString()}
            </span>
          </div>
        </div>
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
            icon={<Clock size={20} />}
          />
        </div>
      </section>

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
          <EditorialEyebrow>Live feed</EditorialEyebrow>
          <div className="mt-4">
            <LiveFeed items={feed} />
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
                  machine={{
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
