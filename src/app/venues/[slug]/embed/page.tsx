/** Embed code generator page — provides venue operators with widget code. */
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PortalPageShell, venueTabs, venueRoleLabel } from "@/components/brand";
import { getUser } from "@/lib/auth";
import { getPartnerForUser } from "@/lib/queries/partners";
import { getVenueBySlug } from "@/lib/queries/venues";
import { getUnreadCount } from "@/lib/queries/notifications";
import { EmbedCodeGenerator } from "@/components/venues/EmbedCodeGenerator";
import { entityTitle, getVenueNameForTitle } from "@/lib/queries/page-titles";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  return { title: entityTitle("Embed", await getVenueNameForTitle(slug)) };
}

export default async function EmbedPage({ params }: Props) {
  const { slug } = await params;
  const user = await getUser();
  if (!user) redirect("/login");

  const venue = await getVenueBySlug(slug);
  if (!venue) redirect("/");

  const partner = await getPartnerForUser(user.id);
  if (!partner || venue.partner_id !== partner.id) redirect("/");

  const unread = await getUnreadCount(user.id);

  return (
    <PortalPageShell
      user={user}
      roleLabel={venueRoleLabel(user.role)}
      unreadCount={unread}
      scope={venue.name}
      section="Embed"
      slug={slug}
      tabs={venueTabs(slug)}
      title="Embed widget"
      subtitle={`Generate embeddable booking widget for ${venue.name}`}
    >
      <EmbedCodeGenerator venueSlug={slug} />
    </PortalPageShell>
  );
}
