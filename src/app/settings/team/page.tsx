/**
 * Team management — customer admins manage team members across their events.
 */
import { redirect } from "next/navigation";
import Link from "next/link";

import {
  EditionShell,
  EditionChrome,
  EditionBody,
  EditionFooter,
  RidgeHero,
  EditorialEyebrow,
  Hairline,
} from "@/components/brand";
import { Badge } from "@/components/ui/badge";
import { CommandPalette } from "@/components/layout/CommandPalette";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { UserMenu } from "@/components/layout/UserMenu";
import { TeamInviteForm } from "@/components/settings/TeamInviteForm";
import { TeamRemoveButton } from "@/components/settings/TeamRemoveButton";

import { getUser } from "@/lib/auth";
import { getUnreadCount } from "@/lib/queries/notifications";
import { getAccountProfiles, getTeamForAccount } from "@/lib/queries/team";

export const metadata = { title: "Team" };

export default async function TeamSettingsPage() {
  const user = await getUser();
  if (!user) redirect("/login");
  if (user.role !== "customer_admin") redirect("/settings");

  const [unread, teamMembers, accountUsers] = await Promise.all([
    getUnreadCount(user.id),
    user.accountId ? getTeamForAccount(user.accountId) : Promise.resolve([]),
    user.accountId ? getAccountProfiles(user.accountId) : Promise.resolve([]),
  ]);

  const pending = teamMembers.filter((m) => m.status === "pending");
  const approved = teamMembers.filter((m) => m.status === "approved");

  return (
    <EditionShell>
      <EditionChrome
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Settings", href: "/settings" },
          { label: "Team" },
        ]}
        rightSlot={
          <>
            <NotificationBell unreadCount={unread} />
            <span className="hidden md:block h-6 w-px bg-border" aria-hidden />
            <UserMenu user={user} />
          </>
        }
      />
      <RidgeHero
        seed={`settings::team::${user.accountId}`}
        eyebrow="Settings · Team"
        title="Your people."
        subtitle="Manage who has access to your events and request new team members."
      />
      <EditionBody>
        <section className="py-10">
          <EditorialEyebrow accent>Account users</EditorialEyebrow>
          <p className="mt-2 text-sm text-muted-foreground max-w-[58ch]">
            Everyone on your account who can access the portal.
          </p>
          <ul className="mt-4 flex flex-col divide-y divide-border/40 border-t border-b border-border/40">
            {accountUsers.map((u) => (
              <li key={u.id} className="flex items-center gap-3 py-3">
                <span className="flex items-center justify-center size-8 rounded-full bg-card border border-border text-overline text-foreground">
                  {(u.name?.[0] ?? u.email[0]).toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground truncate">
                    {u.name ?? u.email}
                  </p>
                  <p className="text-overline text-muted-foreground">
                    {u.email}
                  </p>
                </div>
                <Badge variant="muted" className="capitalize">
                  {(u.role as string).replace(/_/g, " ")}
                </Badge>
              </li>
            ))}
          </ul>
        </section>

        {pending.length > 0 && (
          <>
            <Hairline />
            <section className="py-10">
              <EditorialEyebrow>Pending requests</EditorialEyebrow>
              <ul className="mt-4 flex flex-col divide-y divide-border/40 border-t border-b border-border/40">
                {pending.map((m) => (
                  <li key={m.id} className="flex items-center gap-3 py-3">
                    <span className="text-sm text-foreground flex-1 truncate">
                      {m.email}
                    </span>
                    <span className="text-overline text-muted-foreground">
                      {m.roleLabel}
                    </span>
                    <Badge variant="warning">Pending approval</Badge>
                  </li>
                ))}
              </ul>
            </section>
          </>
        )}

        {approved.length > 0 && (
          <>
            <Hairline />
            <section className="py-10">
              <EditorialEyebrow>Active team members</EditorialEyebrow>
              <ul className="mt-4 flex flex-col divide-y divide-border/40 border-t border-b border-border/40">
                {approved.map((m) => (
                  <li key={m.id} className="flex items-center gap-3 py-3">
                    <span className="text-sm text-foreground flex-1 truncate">
                      {m.profile?.name ?? m.email}
                    </span>
                    <span className="text-overline text-muted-foreground">
                      {m.roleLabel}
                    </span>
                    <TeamRemoveButton memberId={m.id} />
                  </li>
                ))}
              </ul>
            </section>
          </>
        )}

        <Hairline />

        <section className="py-10">
          <EditorialEyebrow accent>Invite a teammate</EditorialEyebrow>
          <p className="mt-2 text-sm text-muted-foreground max-w-[58ch] mb-4">
            Add colleagues to your portal. People on your company email domain
            get access straight away; anyone outside it — or an admin invite —
            is sent to the Bright.Blue team for a quick approval.
          </p>
          {user.accountId && (
            <TeamInviteForm domain={user.email.split("@")[1] ?? ""} />
          )}
        </section>
      </EditionBody>
      <EditionFooter
        rightSlot={
          <Link href="/settings" className="hover:opacity-80 transition-opacity">
            Back to settings →
          </Link>
        }
      />
      <CommandPalette />
    </EditionShell>
  );
}
