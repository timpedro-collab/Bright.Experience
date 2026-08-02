/**
 * Customer settings hub — profile, notification preferences, and account info.
 */
import { redirect } from "next/navigation";
import Link from "next/link";
import { Bell, User, Shield, Users, ArrowRight } from "lucide-react";

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
import { Card } from "@/components/ui/card";

import { getUser } from "@/lib/auth";
import { getUnreadCount } from "@/lib/queries/notifications";
import { isInternalRole } from "@/lib/roles";

export const metadata = {
  title: "Settings · Bright.Experience",
};

const SETTINGS_SECTIONS = [
  {
    title: "Profile",
    description: "Your name, email, and role within the portal.",
    icon: User,
    href: "/settings/profile",
  },
  {
    title: "Notifications",
    description:
      "Control how Bright.Experience reaches you — immediate, digest, or off.",
    icon: Bell,
    href: "/settings/notifications",
  },
  {
    title: "Security",
    description: "Password and active sessions.",
    icon: Shield,
    href: "/settings/security",
  },
  {
    title: "Team",
    description: "Manage team members and control who has access to your events.",
    icon: Users,
    href: "/settings/team",
    adminOnly: true,
  },
];

export default async function SettingsPage() {
  const user = await getUser();
  if (!user) redirect("/login");
  const unread = await getUnreadCount(user.id);
  const isInternal = isInternalRole(user.role);

  return (
    <EditionShell>
      <EditionChrome
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Settings" },
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
        seed={`settings::${user.id}`}
        eyebrow="Settings"
        title="Your preferences."
        subtitle="Manage your profile, notifications, and account details in one place."
      />

      <EditionBody>
        <section className="py-10 md:py-12">
          <EditorialEyebrow accent>Account</EditorialEyebrow>

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {SETTINGS_SECTIONS.filter(
              (s) => !s.adminOnly || user.role === "customer_admin",
            ).map((section) => {
              const Icon = section.icon;
              return (
                <Link key={section.title} href={section.href}>
                  <Card className="p-6 hover:bg-muted/40 transition-colors group h-full">
                    <Icon size={24} className="text-brand mb-3" />
                    <h3 className="text-heading text-sm font-semibold text-foreground">
                      {section.title}
                    </h3>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {section.description}
                    </p>
                    <span className="mt-3 inline-flex items-center gap-1 text-overline text-brand font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                      Open <ArrowRight size={12} />
                    </span>
                  </Card>
                </Link>
              );
            })}
          </div>
        </section>

        <Hairline className="opacity-60" />

        <section className="py-10">
          <EditorialEyebrow>Your account</EditorialEyebrow>
          <div className="mt-4 flex flex-col divide-y divide-border/40 rounded-2xl border border-border bg-card/60 px-5 max-w-lg">
            <div className="py-3 flex justify-between">
              <span className="text-sm text-muted-foreground">Name</span>
              <span className="text-sm text-foreground font-medium">
                {user.name ?? "—"}
              </span>
            </div>
            <div className="py-3 flex justify-between">
              <span className="text-sm text-muted-foreground">Email</span>
              <span className="text-sm text-foreground font-medium">
                {user.email}
              </span>
            </div>
            <div className="py-3 flex justify-between">
              <span className="text-sm text-muted-foreground">Role</span>
              <span className="text-sm text-foreground font-medium capitalize">
                {user.role.replace(/_/g, " ")}
              </span>
            </div>
            {isInternal && (
              <div className="py-3 flex justify-between">
                <span className="text-sm text-muted-foreground">Access</span>
                <span className="text-sm text-brand font-medium">
                  Internal (Bright.Blue)
                </span>
              </div>
            )}
          </div>
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
