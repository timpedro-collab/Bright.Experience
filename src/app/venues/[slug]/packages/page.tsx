/** Venue package management page — create and manage event packages. */
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { getUser } from "@/lib/auth";
import { getVenueBySlug } from "@/lib/queries/venues";
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

  const supabase = await createClient();
  const { data: packages } = await supabase
    .from("venue_packages")
    .select("id, name, description, price, includes_bright_blue, sort_order")
    .eq("venue_id", venue.id)
    .order("sort_order", { ascending: true });

  return (
    <AppShell user={user} isInternal={false}>
      <PageHeader
        title="Packages"
        subtitle={`Event packages offered by ${venue.name}`}
        breadcrumbs={[
          { label: "Venues", href: "/" },
          { label: venue.name, href: `/venues/${slug}/dashboard` },
          { label: "Packages" },
        ]}
      />

      <VenuePackageBuilder
        venueId={venue.id}
        existingPackages={(packages as Array<Record<string, unknown>>) ?? []}
      />
    </AppShell>
  );
}
