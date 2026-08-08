/** Admin page for creating a new campaign — form wired to createCampaign action. */
import { redirect } from "next/navigation";

import { AdminPageShell, EditorialEyebrow } from "@/components/brand";
import { NewCampaignForm } from "@/components/campaigns/NewCampaignForm";

import { getUser } from "@/lib/auth";
import { canViewCommercial } from "@/lib/roles";
import { getUnreadCount } from "@/lib/queries/notifications";

export const metadata = {
  title: "New campaign",
};

export default async function NewCampaignPage() {
  const user = await getUser();
  if (!user) redirect("/login");
  if (!canViewCommercial(user.role)) redirect("/");

  const unread = await getUnreadCount(user.id);

  return (
    <AdminPageShell
      user={user}
      unreadCount={unread}
      section="New campaign"
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Campaigns", href: "/admin/campaigns" },
        { label: "New" },
      ]}
      title="Start a campaign."
      subtitle="Create a multi-event campaign to coordinate activations across locations."
      backHref="/admin/campaigns"
      backLabel="Back to campaigns"
    >
      <section className="py-8">
        <EditorialEyebrow accent>Details</EditorialEyebrow>
        <div className="mt-4">
          <NewCampaignForm />
        </div>
      </section>
    </AdminPageShell>
  );
}
