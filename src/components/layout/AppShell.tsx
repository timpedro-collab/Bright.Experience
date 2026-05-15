/** Authenticated application shell — sidebar, sticky header, Cmd+K, user menu */
"use client";

import { usePathname } from "next/navigation";

import { Sidebar } from "./Sidebar";
import { CommandPalette } from "./CommandPalette";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { UserMenu } from "./UserMenu";
import { PageTransition } from "@/components/ui/motion";
import { useSidebarState } from "@/lib/hooks/useSidebarState";
import { cn } from "@/lib/utils";
import type { User } from "@/types";

interface AppShellProps {
  children: React.ReactNode;
  user: User;
  isInternal?: boolean;
  eventId?: string;
  partnerSlug?: string;
  venueSlug?: string;
  notificationCount?: number;
}

export function AppShell({
  children,
  user,
  isInternal = false,
  eventId,
  partnerSlug,
  venueSlug,
  notificationCount = 0,
}: AppShellProps) {
  const { collapsed, toggle } = useSidebarState();
  const pathname = usePathname();
  const isPartner =
    user.role === "partner_member" || user.role === "partner_admin";

  return (
    <div className="min-h-screen bg-background">
      {/* Skip link for a11y */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:text-primary-foreground focus:shadow-lg"
      >
        Skip to content
      </a>

      <Sidebar
        isInternal={isInternal}
        eventId={eventId}
        partnerSlug={partnerSlug}
        venueSlug={venueSlug}
        collapsed={collapsed}
        onToggle={toggle}
        notificationCount={notificationCount}
        isPartner={isPartner}
      />

      <div
        className={cn(
          "transition-[margin] duration-300",
          collapsed ? "ml-[72px]" : "ml-[260px]"
        )}
        style={{ transitionTimingFunction: "var(--bb-ease-emphasized)" }}
      >
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-white/[0.06] bg-background/70 px-6 backdrop-blur-xl lg:px-8">
          <div className="flex-1 max-w-md">
            <CommandPalette
              isInternal={isInternal}
              partnerSlug={partnerSlug}
              venueSlug={venueSlug}
              eventId={eventId}
            />
          </div>

          <div className="flex items-center gap-2">
            <NotificationBell unreadCount={notificationCount} />
            <span className="hidden md:block h-6 w-px bg-white/[0.06]" aria-hidden />
            <UserMenu user={user} />
          </div>
        </header>

        <main id="main-content" className="p-6 lg:p-8">
          <PageTransition key={pathname}>{children}</PageTransition>
        </main>
      </div>
    </div>
  );
}
