"use client";

/**
 * Live performance for one unit.
 *
 * Polls the show-wide live endpoint and narrows to this machine rather than
 * adding a per-machine route: one poll already carries the whole fleet, and
 * the organizer's fleet board is looking at the same numbers.
 */

import { useState, useEffect, useCallback } from "react";
import { Activity, Users, Gift, ShieldAlert, RefreshCw } from "lucide-react";

import { StatCard } from "@/components/ui/stat-card";
import { LiveFeed } from "@/components/telemetry/LiveFeed";
import { EditorialEyebrow } from "@/components/brand";
import { cn } from "@/lib/utils";
import type { MachineBreakdown } from "@/lib/metrics/fleet";
import type { FeedItem } from "@/lib/metrics/feed-labels";

const POLL_INTERVAL_MS = 15_000;

interface LiveResponse {
  machine_breakdown?: MachineBreakdown[];
  feed?: FeedItem[];
}

interface MachineLiveClientProps {
  eventId: string;
  machineInstanceId: string;
  initialStats: MachineBreakdown;
  initialFeed: FeedItem[];
  /**
   * False for a show that hasn't opened (or has already finished). Nothing is
   * arriving, so the panel drops the "Live" chrome and stops polling instead of
   * spinning at an audience that would read it as broken.
   */
  isLive?: boolean;
  /** What to say instead of "Live" when the show isn't running. */
  dormantLabel?: string;
}

export function MachineLiveClient({
  eventId,
  machineInstanceId,
  initialStats,
  initialFeed,
  isLive = true,
  dormantLabel = "Not running",
}: MachineLiveClientProps) {
  const [stats, setStats] = useState<MachineBreakdown>(initialStats);
  const [feed, setFeed] = useState<FeedItem[]>(initialFeed);
  const [isPolling, setIsPolling] = useState(isLive);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/events/${eventId}/live`, { cache: "no-store" });
      if (!res.ok) return;
      const data: LiveResponse = await res.json();

      const mine = data.machine_breakdown?.find(
        (m) => m.machine_instance_id === machineInstanceId
      );
      if (mine) setStats(mine);

      // The show feed is capped at 30 rows, so a busy neighbour can crowd
      // this unit out entirely. Keep the server-rendered history in that case
      // rather than blanking a panel that had content a second ago.
      const mineFeed = data.feed?.filter(
        (item) => item.machineInstanceId === machineInstanceId
      );
      if (mineFeed && mineFeed.length > 0) setFeed(mineFeed);
    } catch {
      /* network hiccup — retry on next tick */
    }
  }, [eventId, machineInstanceId]);

  useEffect(() => {
    if (!isPolling) return;
    const id = setInterval(fetchData, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [fetchData, isPolling]);

  return (
    <div className="space-y-6">
      <div>
        <div className="mb-4 flex items-center justify-between">
          <EditorialEyebrow accent={isLive}>
            {isLive ? "Today at this unit" : "At this unit"}
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

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard label="Plays" value={stats.plays} icon={Activity} animate={false} />
          <StatCard
            label="Leads"
            value={stats.leads}
            icon={Users}
            hint={
              stats.plays > 0
                ? `${Math.round((stats.leads / stats.plays) * 100)}% of plays opted in`
                : undefined
            }
            animate={false}
          />
          <StatCard label="Prizes" value={stats.prizes} icon={Gift} animate={false} />
          <StatCard
            label="Blocked"
            value={stats.rejected}
            icon={ShieldAlert}
            tone={stats.rejected > 0 ? "warning" : "default"}
            hint="Personal emails and repeat entries turned away"
            animate={false}
          />
        </div>
      </div>

      <div>
        <EditorialEyebrow>Recent activity</EditorialEyebrow>
        <div className="mt-3">
          <LiveFeed items={feed} />
        </div>
      </div>
    </div>
  );
}
