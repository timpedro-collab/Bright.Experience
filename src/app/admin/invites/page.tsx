/** Admin invite page — send customer user invitations. */
import { redirect } from "next/navigation";

import { AdminPageShell, EditorialEyebrow } from "@/components/brand";
import { getUser } from "@/lib/auth";
import { isAdminRole } from "@/lib/roles";
import { getUnreadCount } from "@/lib/queries/notifications";
import { createClient } from "@/lib/supabase/server";
import { InviteForm } from "./InviteForm";

interface AccountOption {
  id: string;
  name: string;
}

export default async function AdminInvitesPage() {
  const user = await getUser();
  if (!user) redirect("/login");
  if (!isAdminRole(user.role)) redirect("/");

  const supabase = await createClient();

  const [{ data: accountRows }, unread] = await Promise.all([
    supabase
      .from("accounts")
      .select("id, name")
      .order("name", { ascending: true }),
    getUnreadCount(user.id),
  ]);

  const accounts: AccountOption[] = (accountRows ?? []).map(
    (a: Record<string, unknown>) => ({
      id: String(a.id),
      name: String(a.name),
    })
  );

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
