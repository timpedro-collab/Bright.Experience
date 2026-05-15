/**
 * Per-user notification preferences.
 *
 * The page splits archetypes into two sections — "Action items" (Class A)
 * and "FYI" (Class B) — and renders different controls per class:
 *
 *   - Class A: the in-portal lane is shown as "Always on" and is not
 *     editable. A single Immediate / Daily digest / Off control governs
 *     email. A standing footnote reminds the user that reminders may
 *     re-email them anyway if a Class A item sits long enough.
 *   - Class B: both lanes are editable.
 *
 * Server-render the current state, hand off to a thin client wrapper for
 * the toggle interactions.
 */

import { redirect } from "next/navigation";

import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { NotificationPreferencesForm } from "@/components/settings/NotificationPreferencesForm";

import { getUser } from "@/lib/auth";
import { isInternalRole } from "@/lib/roles";
import { createClient } from "@/lib/supabase/server";
import { getUnreadCount } from "@/lib/queries/notifications";

export const metadata = {
  title: "Notification settings · Bright.Experience",
};

export default async function NotificationSettingsPage() {
  const user = await getUser();
  if (!user) redirect("/login");
  const isInternal = isInternalRole(user.role);

  const supabase = await createClient();
  const [{ data: preferences }, unread] = await Promise.all([
    supabase
      .from("notification_preferences")
      .select("kind, in_portal, email_mode")
      .eq("user_id", user.id),
    getUnreadCount(user.id),
  ]);

  const prefMap: Record<
    string,
    { inPortal: boolean; emailMode: "immediate" | "digest" | "off" }
  > = {};
  for (const row of preferences ?? []) {
    prefMap[row.kind as string] = {
      inPortal: Boolean(row.in_portal),
      emailMode: row.email_mode as "immediate" | "digest" | "off",
    };
  }

  return (
    <AppShell user={user} isInternal={isInternal} notificationCount={unread}>
      <PageHeader
        eyebrow="Settings"
        title="Notifications"
        subtitle="Choose how Bright.Experience reaches you. Action items will always show up in the portal — that's how we keep your event moving."
      />
      <NotificationPreferencesForm initialPreferences={prefMap} />
    </AppShell>
  );
}
