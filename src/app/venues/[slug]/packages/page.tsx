/** Venue package management page — create and manage event packages. */
import { redirect } from "next/navigation";
import { PortalPageShell, venueTabs, venueRoleLabel } from "@/components/brand";
import { getUser } from "@/lib/auth";
import { getPartnerForUser } from "@/lib/queries/partners";
import { getVenueBySlug } from "@/lib/queries/venues";
import { getUnreadCount } from "@/lib/queries/notifications";
import { getVenuePackagesByVenueId } from "@/lib/queries/venue-packages";
import { VenuePackageBuilder } from "@/components/venues/VenuePackageBuilder";

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

  const [packages, unread] = await Promise.all([
    getVenuePackagesByVenueId(venue.id),
    getUnreadCount(user.id),
  ]);

  return (
    <PortalPageShell
      user={user}
      roleLabel={venueRoleLabel(user.role)}
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
        existingPackages={packages as unknown as Array<Record<string, unknown>>}
      />
    </PortalPageShell>
  );
}
