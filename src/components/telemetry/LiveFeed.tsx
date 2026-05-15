/** Scrolling live feed of recent event interactions and captured leads */
"use client";

import { useEffect, useRef } from "react";
import { Zap, UserPlus, Gift, MousePointerClick } from "lucide-react";
import { cn } from "@/lib/utils";

interface FeedItem {
  id: string;
  type: string;
  message: string;
  timestamp: string;
}

interface LiveFeedProps {
  items: FeedItem[];
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
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}

export function LiveFeed({ items }: LiveFeedProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [items]);

  return (
    <div
      ref={scrollRef}
      className="max-h-[360px] overflow-y-auto space-y-2 pr-1 scrollbar-thin"
    >
      {items.length === 0 && (
        <p className="text-sm text-text-muted text-center py-8">
          No activity yet
        </p>
      )}
      {items.map((item) => {
        const Icon = TYPE_ICONS[item.type] ?? TYPE_ICONS.default;
        return (
          <div
            key={item.id}
            className="flex items-start gap-3 rounded-xl border border-white/[0.04] bg-white/[0.02] px-4 py-3"
          >
            <div
              className={cn(
                "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg",
                item.type === "lead" && "bg-success/10 text-success",
                item.type === "play" && "bg-brand/10 text-brand",
                item.type === "prize" && "bg-warning/10 text-warning",
                !["lead", "play", "prize"].includes(item.type) &&
                  "bg-white/[0.06] text-text-muted"
              )}
            >
              <Icon size={14} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm text-text-primary truncate">
                {item.message}
              </p>
              <p className="text-xs text-text-muted mt-0.5">
                {getRelativeTime(item.timestamp)}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
