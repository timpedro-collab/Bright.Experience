/** Admin account detail — one organisation's profile, users, and events. */
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { Building2, Users, CalendarCheck, ArrowLeft } from "lucide-react";

import { AdminPageShell, EditorialEyebrow, Hairline } from "@/components/brand";
import { KpiGrid, KpiCard } from "@/components/cloud";
import { EventHealthBadge, StageBadge } from "@/components/ui/StatusBadge";

import { getUser } from "@/lib/auth";
import { isAdminRole } from "@/lib/roles";
import { getAccountDetail } from "@/lib/queries/admin";
import { getUnreadCount } from "@/lib/queries/notifications";
import { formatDateMedium } from "@/lib/dates";
import type { Stage, HealthStatus } from "@/types";

function formatRole(role: string): string {
  return role
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export const metadata = {
  title: "Account detail",
};

export default async function AdminAccountDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getUser();
  if (!user) redirect("/login");
  if (!isAdminRole(user.role)) redirect("/");

  const { id } = await params;
  const [account, unread] = await Promise.all([
    getAccountDetail(id),
    getUnreadCount(user.id),
  ]);
  if (!account) return notFound();

  const activeUsers = account.users.filter((u) => u.isActive).length;
  const liveEvents = account.events.filter(
    (e) => e.currentStage !== "complete",
  ).length;

  return (
    <AdminPageShell
      user={user}
      unreadCount={unread}
      section="Accounts"
      title={account.name}
      subtitle={`${account.slug} · ${account.users.length} user${account.users.length === 1 ? "" : "s"} · ${account.events.length} event${account.events.length === 1 ? "" : "s"}.`}
    >
      <div className="space-y-8 py-8">
        <Link
          href="/admin/accounts"
          className="inline-flex items-center gap-1.5 text-overline text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> All accounts
        </Link>

        <KpiGrid>
          <KpiCard label="Users" value={account.users.length} icon={Users} hint={`${activeUsers} active`} />
          <KpiCard label="Events" value={account.events.length} icon={CalendarCheck} hint={`${liveEvents} in flight`} />
          <KpiCard
            label="On platform since"
            value={account.createdAt ? formatDateMedium(account.createdAt) : "—"}
            icon={Building2}
          />
        </KpiGrid>

        <section>
          <EditorialEyebrow accent>Team</EditorialEyebrow>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/40 text-left text-overline text-muted-foreground">
                  <th className="py-2 pr-4">Name</th>
                  <th className="py-2 pr-4">Email</th>
                  <th className="py-2 pr-4">Role</th>
                  <th className="py-2 pr-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {account.users.map((u) => (
                  <tr key={u.id} className="border-b border-border/20">
                    <td className="py-2.5 pr-4 font-medium text-foreground">
                      {u.name ?? "—"}
                    </td>
                    <td className="py-2.5 pr-4 text-muted-foreground">{u.email}</td>
                    <td className="py-2.5 pr-4 text-muted-foreground">
                      {formatRole(u.role)}
                    </td>
                    <td className="py-2.5 pr-4">
                      <span
                        className={
                          u.isActive
                            ? "text-success text-xs font-medium"
                            : "text-muted-foreground text-xs"
                        }
                      >
                        {u.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                  </tr>
                ))}
                {account.users.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-muted-foreground">
                      No users on this account yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <Hairline className="opacity-60" />

        <section>
          <EditorialEyebrow>Events</EditorialEyebrow>
          <div className="mt-4 space-y-2">
            {account.events.map((e) => (
              <Link
                key={e.id}
                href={`/events/${e.id}`}
                className="flex flex-wrap items-center gap-3 rounded-2xl border border-border/60 px-4 py-3 transition-colors hover:bg-muted/40"
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-foreground">
                    {e.name}
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    {formatDateMedium(e.eventDateStart)}
                  </span>
                </span>
                <StageBadge stage={e.currentStage as Stage} />
                <EventHealthBadge
                  event={{
                    healthStatus: e.healthStatus as HealthStatus,
                    currentStage: e.currentStage as Stage,
                    eventDateStart: e.eventDateStart,
                  }}
                />
              </Link>
            ))}
            {account.events.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No events for this account yet.
              </p>
            )}
          </div>
        </section>
      </div>
    </AdminPageShell>
  );
}
