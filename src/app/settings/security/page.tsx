/** Security settings — password management and session controls. */
import { redirect } from "next/navigation";
import Link from "next/link";

import {
  EditionShell, EditionChrome, EditionBody, EditionFooter,
  RidgeHero, EditorialEyebrow, Hairline,
} from "@/components/brand";
import { CommandPalette } from "@/components/layout/CommandPalette";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { UserMenu } from "@/components/layout/UserMenu";
import { SecurityForm } from "@/components/settings/SecurityForm";

import { getUser } from "@/lib/auth";
import { getUnreadCount } from "@/lib/queries/notifications";

export const metadata = { title: "Security" };

export default async function SecuritySettingsPage() {
  const user = await getUser();
  if (!user) redirect("/login");
  const unread = await getUnreadCount(user.id);

  return (
    <EditionShell>
      <EditionChrome
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Settings", href: "/settings" },
          { label: "Security" },
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
        seed={`settings::security::${user.id}`}
        eyebrow="Settings · Security"
        title="Keep your account safe."
        subtitle="Update your password and manage active sessions."
      />

      <EditionBody>
        <section className="py-10 md:py-12">
          <EditorialEyebrow accent>Password & sessions</EditorialEyebrow>
          <p className="mt-2 text-sm text-muted-foreground max-w-[60ch]">
            Change your password or sign out of all devices at once.
          </p>
          <div className="mt-6">
            <SecurityForm email={user.email} />
          </div>
        </section>

        <Hairline className="opacity-60" />

        <section className="py-10">
          <EditorialEyebrow>Need help?</EditorialEyebrow>
          <p className="mt-3 text-sm text-muted-foreground max-w-[60ch] leading-relaxed">
            If you are locked out or need to reset your email, contact your
            Bright.Blue account manager.
          </p>
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
