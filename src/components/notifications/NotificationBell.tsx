/** Notification bell — navigates to /notifications, shows live unread count */
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { cn } from "@/lib/utils";

const POLL_INTERVAL_MS = 30_000;

interface NotificationBellProps {
  unreadCount: number;
}

export function NotificationBell({ unreadCount }: NotificationBellProps) {
  const [liveCount, setLiveCount] = useState(unreadCount);

  useEffect(() => {
    setLiveCount(unreadCount);
  }, [unreadCount]);

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      try {
        const res = await fetch("/api/notifications/count");
        if (!res.ok || cancelled) return;
        const json = (await res.json()) as { count: number };
        if (!cancelled) setLiveCount(json.count);
      } catch {
        /* network hiccup — keep the last known count */
      }
    }

    const id = setInterval(poll, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  const hasUnread = liveCount > 0;

  return (
    <Link
      href="/notifications"
      data-tour="notifications"
      aria-label={`Notifications${hasUnread ? ` (${liveCount} unread)` : ""}`}
      className={cn(
        "relative inline-flex h-9 w-9 items-center justify-center rounded-[var(--radius-control)]",
        "text-muted-foreground transition-colors",
        "hover:bg-white/[0.04] hover:text-foreground",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
      )}
    >
      <Bell className="h-[18px] w-[18px]" />
      {/* initial={false} suppresses the entrance animation on first mount;
          subsequent count changes (new key) still animate in. */}
      <AnimatePresence mode="wait" initial={false}>
        {hasUnread && (
          <motion.span
            key={liveCount}
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.6, opacity: 0 }}
            transition={{ type: "spring", stiffness: 500, damping: 25 }}
            className={cn(
              "absolute -top-0.5 -right-0.5 inline-flex items-center justify-center",
              "min-w-[18px] h-[18px] px-1 rounded-full",
              "bg-primary text-primary-foreground",
              "text-[10px] font-semibold leading-none tabular-nums",
              "shadow-[0_4px_10px_-4px_hsl(230,93%,53%,0.55)]",
            )}
          >
            {liveCount > 99 ? "99+" : liveCount}
          </motion.span>
        )}
      </AnimatePresence>
      {hasUnread && (
        <span
          aria-hidden
          className="absolute top-1.5 right-1.5 inline-flex h-2 w-2 rounded-full bg-primary shadow-[0_0_8px_hsl(230,93%,53%,0.65)] animate-pulse"
        />
      )}
    </Link>
  );
}
