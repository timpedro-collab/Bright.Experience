/** Embed code generator page — provides venue operators with widget code. */
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { getUser } from "@/lib/auth";
import { getVenueBySlug } from "@/lib/queries/venues";
import { EmbedCodeGenerator } from "@/components/venues/EmbedCodeGenerator";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function EmbedPage({ params }: Props) {
  const { slug } = await params;
  const user = await getUser();
  if (!user) redirect("/login");

  const venue = await getVenueBySlug(slug);
  if (!venue) redirect("/");

  return (
    <AppShell user={user} isInternal={false}>
      <PageHeader
        title="Embed Widget"
        subtitle={`Generate embeddable booking widget for ${venue.name}`}
        breadcrumbs={[
          { label: "Venues", href: "/" },
          { label: venue.name, href: `/venues/${slug}/dashboard` },
          { label: "Embed" },
        ]}
      />

      <EmbedCodeGenerator venueSlug={slug} />
    </AppShell>
  );
}
