/**
 * Profile settings — update name and view account details.
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
import { CommandPalette } from "@/components/layout/CommandPalette";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { UserMenu } from "@/components/layout/UserMenu";
import { ProfileForm } from "@/components/settings/ProfileForm";

import { getUser } from "@/lib/auth";
import { getUnreadCount } from "@/lib/queries/notifications";
import { getAccountNameSlug } from "@/lib/queries/admin";

export const metadata = {
  title: "Profile · Bright.Experience",
};

export default async function ProfileSettingsPage() {
  const user = await getUser();
  if (!user) redirect("/login");
  const [unread, account] = await Promise.all([
    getUnreadCount(user.id),
    user.accountId ? getAccountNameSlug(user.accountId) : Promise.resolve(null),
  ]);

  return (
    <EditionShell>
      <EditionChrome
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Settings", href: "/settings" },
          { label: "Profile" },
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
        seed={`settings::profile::${user.id}`}
        eyebrow="Settings · Profile"
        title="Your identity."
        subtitle="How you appear across the Bright.Experience portal."
      />

      <EditionBody>
        <section className="grid grid-cols-1 lg:grid-cols-[1fr_18rem] gap-x-12 gap-y-8 py-10">
          <div>
            <EditorialEyebrow accent>Personal details</EditorialEyebrow>
            <p className="mt-2 text-sm text-muted-foreground max-w-[60ch]">
              Update your display name. Your email address is tied to your
              authentication account and cannot be changed here.
            </p>
            <div className="mt-6 max-w-lg">
              <ProfileForm
                initialName={user.name ?? ""}
                email={user.email}
              />
            </div>
          </div>

          <aside className="space-y-8 lg:border-l lg:border-border/40 lg:pl-8">
            <div>
              <EditorialEyebrow>Account</EditorialEyebrow>
              <div className="mt-3 flex flex-col divide-y divide-border/40 border-t border-b border-border/40">
                <div className="py-3">
                  <span className="text-overline text-muted-foreground block">
                    Organisation
                  </span>
                  <span className="text-sm text-foreground font-medium">
                    {account?.name ?? "Personal account"}
                  </span>
                </div>
                <div className="py-3">
                  <span className="text-overline text-muted-foreground block">
                    Role
                  </span>
                  <span className="text-sm text-foreground font-medium capitalize">
                    {user.role.replace(/_/g, " ")}
                  </span>
                </div>
              </div>
            </div>

            <Hairline />

            <div>
              <EditorialEyebrow>Need help?</EditorialEyebrow>
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                If you need to change your email or update account details,
                contact your Bright.Blue account manager.
              </p>
            </div>
          </aside>
        </section>
      </EditionBody>

      <EditionFooter
        rightSlot={
          <Link
            href="/settings"
            className="hover:opacity-80 transition-opacity"
          >
            Back to settings →
          </Link>
        }
      />
      <CommandPalette />
    </EditionShell>
  );
}
