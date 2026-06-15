/** Venue package management page — create and manage event packages. */
import { redirect } from "next/navigation";
import { PortalPageShell, venueTabs } from "@/components/brand";
import { getUser } from "@/lib/auth";
import { getPartnerForUser } from "@/lib/queries/partners";
import { getVenueBySlug } from "@/lib/queries/venues";
import { getUnreadCount } from "@/lib/queries/notifications";
import { VenuePackageBuilder } from "@/components/venues/VenuePackageBuilder";
import { createClient } from "@/lib/supabase/server";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function PackagesPage({ params }: Props) {
  const { slug } = await params;
  const user = await getUser();
  if (!user) redirect("/login");

  const venue = await getVenueBySlug(slug);
  if (!venue) redirect("/");

  const partner = await getPartnerForUser(user.id);
  if (!partner || venue.partner_id !== partner.id) redirect("/");

  const supabase = await createClient();
  const [{ data: packages }, unread] = await Promise.all([
    supabase
      .from("venue_packages")
      .select("id, name, description, price, includes_bright_blue, sort_order")
      .eq("venue_id", venue.id)
      .order("sort_order", { ascending: true }),
    getUnreadCount(user.id),
  ]);

  return (
    <PortalPageShell
      user={user}
      unreadCount={unread}
      scope={venue.name}
      section="Packages"
      slug={slug}
      tabs={venueTabs(slug)}
      title="Packages"
      subtitle={`Event packages offered by ${venue.name}`}
    >
      <VenuePackageBuilder
        venueId={venue.id}
        existingPackages={(packages as Array<Record<string, unknown>>) ?? []}
      />
    </PortalPageShell>
  );
}
