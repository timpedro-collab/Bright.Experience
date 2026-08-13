/**
 * Per-user notification preferences.
 *
 * Splits archetypes into "Action items" (Class A) and "FYI" (Class B)
 * and renders different controls per class. Class A users can only
 * tune email cadence; Class B users can tune both portal and email.
 *
 * Editorial Bright.Experience design language — EditionShell + RidgeHero
 * with a calm centred form column.
 */

import { redirect } from "next/navigation";
import Link from "next/link";

import { CommandPalette } from "@/components/layout/CommandPalette";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { UserMenu } from "@/components/layout/UserMenu";
import {
  EditionShell,
  EditionChrome,
  EditionBody,
  EditionFooter,
  RidgeHero,
  EditorialEyebrow,
  Hairline,
} from "@/components/brand";
import { NotificationPreferencesForm } from "@/components/settings/NotificationPreferencesForm";
import { NotificationTimingForm } from "@/components/settings/NotificationTimingForm";
import { DEFAULT_DIGEST_TIMING } from "@/lib/notifications/digest-timing";

import { getUser } from "@/lib/auth";
import { isInternalRole } from "@/lib/roles";
import {
  getNotificationPreferences,
  getNotificationUserSettings,
  getUnreadCount,
} from "@/lib/queries/notifications";

export const metadata = {
  title: "Notification settings",
};

export default async function NotificationSettingsPage() {
  const user = await getUser();
  if (!user) redirect("/login");

  const [preferences, timingRow, unread] = await Promise.all([
    getNotificationPreferences(user.id),
    getNotificationUserSettings(user.id),
    getUnreadCount(user.id),
  ]);

  const timing = {
    timezone: timingRow?.timezone ?? DEFAULT_DIGEST_TIMING.timezone,
    digestHour: timingRow?.digestHour ?? DEFAULT_DIGEST_TIMING.digestHour,
    quietStartHour:
      timingRow?.quietStartHour ?? DEFAULT_DIGEST_TIMING.quietStartHour,
    quietEndHour: timingRow?.quietEndHour ?? DEFAULT_DIGEST_TIMING.quietEndHour,
  };

  const prefMap: Record<
    string,
    { inPortal: boolean; emailMode: "immediate" | "digest" | "off" }
  > = {};
  for (const row of preferences) {
    prefMap[row.kind] = {
      inPortal: row.inPortal,
      emailMode: row.emailMode,
    };
  }

  return (
    <EditionShell>
      <EditionChrome
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Settings" },
          { label: "Notifications" },
        ]}
        rightSlot={
          <>
            <NotificationBell unreadCount={unread} />
            <span
              className="hidden md:block h-6 w-px bg-border"
              aria-hidden
            />
            <UserMenu user={user} />
          </>
        }
      />

      <RidgeHero
        seed={`settings::notifications::${user.id}`}
        eyebrow="Settings · Notifications"
        title="Quieter inbox."
        subtitle="Choose how Bright.Experience reaches you. Action items always show up in the portal — that's how we keep your event moving."
      />

      <EditionBody>
        <section className="grid grid-cols-1 lg:grid-cols-[1fr_18rem] gap-x-12 gap-y-8 py-10">
          <div>
            <EditorialEyebrow accent>Your channels</EditorialEyebrow>
            <p className="mt-2 text-sm text-muted-foreground max-w-[60ch]">
              Each row is one type of notification. Toggle the portal lane
              and choose how often you want an email — immediate, daily
              digest, or off.
            </p>
            <div className="mt-6">
              <NotificationPreferencesForm
                initialPreferences={prefMap}
                viewerAudience={isInternalRole(user.role) ? "internal" : "customer"}
              />
            </div>

            <div className="mt-8">
              <EditorialEyebrow accent>Digest timing</EditorialEyebrow>
              <p className="mt-2 text-sm text-muted-foreground max-w-[60ch]">
                Your daily digest is sent once a day at the local time you
                choose, and we hold emails during your quiet hours.
              </p>
              <div className="mt-6 max-w-md">
                <NotificationTimingForm initial={timing} />
              </div>
            </div>
          </div>

          <aside className="space-y-8 lg:border-l lg:border-border/40 lg:pl-8">
            <div>
              <EditorialEyebrow>The classes</EditorialEyebrow>
              <ul className="mt-3 flex flex-col divide-y divide-border/40 border-t border-b border-border/40">
                <li className="py-3">
                  <p className="text-overline text-[var(--color-bb-cobalt)]">
                    Class A · Action items
                  </p>
                  <p className="mt-1 text-sm text-foreground">
                    Things that need your decision. The portal lane is
                    always on. You can quiet the email but reminders may
                    re-email if an item sits long enough.
                  </p>
                </li>
                <li className="py-3">
                  <p className="text-overline text-muted-foreground">
                    Class B · FYI
                  </p>
                  <p className="mt-1 text-sm text-foreground">
                    Updates that are good to know. Both lanes are fully
                    optional — turn them on, off, or batch into a daily
                    digest.
                  </p>
                </li>
              </ul>
            </div>

            <Hairline />

            <div>
              <EditorialEyebrow>Need different defaults?</EditorialEyebrow>
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                If you&apos;re sharing the account with a teammate and want
                separate notification rhythms, drop us a line and we can
                set up multiple seats.
              </p>
              <Link
                href="mailto:hello@brightblue.com"
                className="mt-3 inline-block text-overline text-[var(--color-bb-cobalt)] underline decoration-from-font underline-offset-4 font-medium"
              >
                Email us →
              </Link>
            </div>
          </aside>
        </section>
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
