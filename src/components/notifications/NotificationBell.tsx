/** Notification bell — navigates to /notifications, shows live unread count */
"use client";

import Link from "next/link";
import { Bell } from "lucide-react";

import { cn } from "@/lib/utils";

interface NotificationBellProps {
  unreadCount: number;
}

export function NotificationBell({ unreadCount }: NotificationBellProps) {
  const hasUnread = unreadCount > 0;
  return (
    <Link
      href="/notifications"
      aria-label={`Notifications${hasUnread ? ` (${unreadCount} unread)` : ""}`}
      className={cn(
        "relative inline-flex h-9 w-9 items-center justify-center rounded-[var(--radius-control)]",
        "text-muted-foreground transition-colors",
        "hover:bg-white/[0.04] hover:text-foreground",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      )}
    >
      <Bell className="h-[18px] w-[18px]" />
      {hasUnread && (
        <>
          <span
            aria-hidden
            className="absolute top-1.5 right-1.5 inline-flex h-2 w-2 rounded-full bg-primary shadow-[0_0_8px_hsl(223,94%,53%,0.65)] animate-pulse"
          />
          <span
            className={cn(
              "absolute -top-0.5 -right-0.5 inline-flex items-center justify-center",
              "min-w-[18px] h-[18px] px-1 rounded-full",
              "bg-primary text-primary-foreground",
              "text-[10px] font-semibold leading-none tabular-nums",
              "shadow-[0_4px_10px_-4px_hsl(223,94%,53%,0.55)]"
            )}
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        </>
      )}
    </Link>
  );
}
