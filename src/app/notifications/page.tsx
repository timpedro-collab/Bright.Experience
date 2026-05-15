/** Notification centre — grouped & filtered view of recent activity */
import { redirect } from "next/navigation";
import { Bell } from "lucide-react";

import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { NotificationList } from "@/components/notifications/NotificationList";
import { MarkAllReadButton } from "@/components/notifications/MarkAllReadButton";

import {
  getNotificationsByUser,
  getUnreadCount,
} from "@/lib/queries/notifications";
import { getUser } from "@/lib/auth";
import { isInternalRole } from "@/lib/roles";

export default async function NotificationsPage() {
  const user = await getUser();
  if (!user) redirect("/login");
  const isInternal = isInternalRole(user.role);

  const [notifications, unread] = await Promise.all([
    getNotificationsByUser(user.id),
    getUnreadCount(user.id),
  ]);

  const actionRequiredCount = notifications.filter(
    (n) => n.actionRequired && !n.isRead
  ).length;

  return (
    <AppShell user={user} isInternal={isInternal} notificationCount={unread}>
      <PageHeader
        eyebrow="Stay in the loop"
        title="Notifications"
        subtitle={
          actionRequiredCount > 0
            ? `${actionRequiredCount} item${
                actionRequiredCount === 1 ? "" : "s"
              } waiting on you. Everything else is good to know.`
            : unread > 0
              ? `You have ${unread} unread notification${
                  unread === 1 ? "" : "s"
                }.`
              : "You're all caught up."
        }
        actions={unread > 0 ? <MarkAllReadButton /> : undefined}
      />
      {notifications.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="No notifications yet"
          description="When something needs your attention — assets uploaded, approvals decided, stage changes — it'll appear right here."
          action={{ label: "Back to dashboard", href: "/" }}
          size="lg"
        />
      ) : (
        <NotificationList notifications={notifications} />
      )}
    </AppShell>
  );
}
