/** Scrolling live feed of recent event interactions and captured leads */
"use client";

import { useEffect, useRef, useState } from "react";
import { Zap, UserPlus, Gift, MousePointerClick } from "lucide-react";
import { cn } from "@/lib/utils";

interface FeedItem {
  id: string;
  type: string;
  message: string;
  timestamp: string;
  machineInstanceId?: string | null;
}

interface LiveFeedProps {
  items: FeedItem[];
  /** When set, only rows for this machine instance are shown. */
  machineFilter?: string | null;
}

const TYPE_ICONS: Record<string, React.ElementType> = {
  lead: UserPlus,
  play: MousePointerClick,
  prize: Gift,
  default: Zap,
};

function getRelativeTime(timestamp: string): string {
  const diff = Date.now() - new Date(timestamp).getTime();
  const seconds = Math.floor(diff / 1000);
  // A row can carry a timestamp a few seconds ahead of the reader's clock —
  // machines and browsers drift. Reading "-8s ago" makes the whole feed look
  // broken, so anything within the last minute (or slightly ahead) is "just
  // now".
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function LiveFeed({ items, machineFilter = null }: LiveFeedProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const visibleItems = machineFilter
    ? items.filter((item) => item.machineInstanceId === machineFilter)
    : items;

  // Items present on first render don't animate — only ones that arrive
  // while the user is watching slide in (once, on mount; keys are stable
  // so the animation never re-fires, and reduced-motion users get none).
  const [initialIds] = useState(() => new Set(items.map((i) => i.id)));

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [visibleItems]);

  return (
    <div
      id="live-feed"
      ref={scrollRef}
      className="max-h-[360px] overflow-y-auto space-y-2 pr-1 scrollbar-thin"
    >
      {visibleItems.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-8">
          {machineFilter ? "No activity for this machine yet" : "No activity yet"}
        </p>
      )}
      {visibleItems.map((item) => {
        const Icon = TYPE_ICONS[item.type] ?? TYPE_ICONS.default;
        const isNew = !initialIds.has(item.id);
        return (
          <div
            key={item.id}
            className={cn(
              "flex items-start gap-3 rounded-xl border border-border/60 bg-muted/40 px-4 py-3",
              isNew && "feed-item-in"
            )}
          >
            <div
              className={cn(
                "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg",
                item.type === "lead" && "bg-success/10 text-success",
                item.type === "play" && "bg-brand/10 text-brand",
                item.type === "prize" && "bg-warning/10 text-warning",
                !["lead", "play", "prize"].includes(item.type) &&
                  "bg-muted text-muted-foreground"
              )}
            >
              <Icon size={14} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm text-foreground truncate">
                {item.message}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {getRelativeTime(item.timestamp)}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
