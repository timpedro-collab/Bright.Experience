/** Admin invite page — send customer user invitations. */
import { redirect } from "next/navigation";

import { AdminPageShell, EditorialEyebrow } from "@/components/brand";
import { getUser } from "@/lib/auth";
import { isAdminRole } from "@/lib/roles";
import { getAccountOptions } from "@/lib/queries/admin";
import { getUnreadCount } from "@/lib/queries/notifications";
import { InviteForm } from "./InviteForm";

export default async function AdminInvitesPage() {
  const user = await getUser();
  if (!user) redirect("/login");
  if (!isAdminRole(user.role)) redirect("/");

  const [accounts, unread] = await Promise.all([
    getAccountOptions(),
    getUnreadCount(user.id),
  ]);

  return (
    <AdminPageShell
      user={user}
      unreadCount={unread}
      section="Invites"
      title="Invite a customer."
      subtitle="Send a portal invitation to a customer user."
    >
      <div className="max-w-lg py-8 space-y-6">
        <EditorialEyebrow>New invitation</EditorialEyebrow>
        <InviteForm accounts={accounts} />
      </div>
    </AdminPageShell>
  );
}
