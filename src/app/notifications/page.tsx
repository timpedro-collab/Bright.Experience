/**
 * Notifications surface — every recent activity item for the current user,
 * grouped by `Awaiting you` (action required) and `FYI` (everything else),
 * with recency subheadings inside FYI.
 *
 * Uses the editorial Bright.Experience design language:
 *   - <EditionShell> wrapper (deep ink chrome, no sidebar)
 *   - tracked uppercase eyebrows for section labels
 *   - hairline rules between rows, no chunky cards
 *   - cobalt accent stripe on action-required rows
 *
 * The grouping/clicking logic lives in <NotificationList>; this page is
 * a thin server component that fetches the data and hands it off.
 */

import { redirect } from "next/navigation";
import Link from "next/link";
import { Bell } from "lucide-react";

import { CommandPalette } from "@/components/layout/CommandPalette";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { UserMenu } from "@/components/layout/UserMenu";
import {
  EditionShell,
  EditionChrome,
  EditionBody,
  EditionFooter,
  EditorialEyebrow,
  Hairline,
} from "@/components/brand";
import { EmptyState } from "@/components/ui/EmptyState";
import { NotificationList } from "@/components/notifications/NotificationList";
import { MarkAllReadButton } from "@/components/notifications/MarkAllReadButton";

import {
  getNotificationsByUserPaginated,
  getUnreadCount,
} from "@/lib/queries/notifications";
import { getUser } from "@/lib/auth";
import { isInternalRole } from "@/lib/roles";
import { parsePage } from "@/lib/pagination";
import { Pagination } from "@/components/ui/Pagination";

export const metadata = {
  title: "Notifications",
};

interface NotificationsPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function NotificationsPage({
  searchParams,
}: NotificationsPageProps) {
  const user = await getUser();
  if (!user) redirect("/login");
  const isInternal = isInternalRole(user.role);

  const params = await searchParams;
  const page = parsePage(params);

  const [{ data: notifications, totalPages }, unread] = await Promise.all([
    getNotificationsByUserPaginated(user.id, page),
    getUnreadCount(user.id),
  ]);

  const actionRequiredCount = notifications.filter(
    (n) => n.actionRequired && !n.isRead,
  ).length;

  const subtitle =
    actionRequiredCount > 0
      ? `${actionRequiredCount} item${
          actionRequiredCount === 1 ? "" : "s"
        } waiting on you. Everything else is good to know.`
      : unread > 0
        ? `You have ${unread} unread notification${unread === 1 ? "" : "s"}.`
        : "You're all caught up.";

  return (
    <EditionShell>
      <EditionChrome
        breadcrumbs={[{ label: "Notifications" }]}
        rightSlot={
          <>
            {unread > 0 && <MarkAllReadButton />}
            <NotificationBell unreadCount={unread} />
            <span
              className="hidden md:block h-6 w-px bg-border"
              aria-hidden
            />
            <UserMenu user={user} />
          </>
        }
      />

      <section className="mx-auto max-w-[1440px] px-6 md:px-10 lg:px-14 pt-10 md:pt-14 pb-8">
        <EditorialEyebrow accent>Your inbox</EditorialEyebrow>
        <h1 className="text-display text-foreground text-[clamp(2.25rem,4.5vw,3.75rem)] mt-2 max-w-[20ch]">
          Everything pinging your name.
        </h1>
        <p className="mt-3 max-w-[60ch] text-base text-muted-foreground">
          {subtitle}
        </p>
        <Hairline className="mt-10" />
      </section>

      <EditionBody className="pt-0">
        {notifications.length === 0 ? (
          <EmptyState
            icon={Bell}
            title="No notifications yet"
            description="When something needs your attention — assets uploaded, approvals decided, stage changes — it'll appear right here."
            action={{ label: "Return to Dashboard", href: "/" }}
            size="lg"
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_18rem] gap-x-12 gap-y-8">
            <div>
              <NotificationList notifications={notifications} />
            </div>
            <aside className="flex flex-col gap-6 lg:border-l lg:border-border/40 lg:pl-8">
              <div>
                <EditorialEyebrow>What is this?</EditorialEyebrow>
                <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                  Every event in production sends a few quiet pings — when
                  an asset is uploaded, when a stage advances, when
                  someone messages you. They land here so nothing slips.
                </p>
              </div>
              <Hairline />
              <div>
                <EditorialEyebrow>Quieter inbox?</EditorialEyebrow>
                <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                  Mute the notification types you don&apos;t need. Keep the
                  approval pings, drop the daily summaries.
                </p>
                <Link
                  href="/settings/notifications"
                  className="mt-3 inline-block text-overline text-[var(--color-bb-cobalt)] underline decoration-from-font underline-offset-4 font-medium"
                >
                  Open notification preferences →
                </Link>
              </div>
              {isInternal && (
                <>
                  <Hairline />
                  <div>
                    <EditorialEyebrow>Internal only</EditorialEyebrow>
                    <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                      For task-level work assigned to you across every
                      event, the cross-event work hub is the place.
                    </p>
                    <Link
                      href="/inbox"
                      className="mt-3 inline-block text-overline text-[var(--color-bb-cobalt)] underline decoration-from-font underline-offset-4 font-medium"
                    >
                      Open the work hub →
                    </Link>
                  </div>
                </>
              )}
            </aside>
          </div>
        )}
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          basePath="/notifications"
        />
      </EditionBody>

      <EditionFooter
        rightSlot={
          <Link href="/" className="hover:opacity-80 transition-opacity">
            Back to home →
          </Link>
        }
      />
      <CommandPalette />
    </EditionShell>
  );
}
