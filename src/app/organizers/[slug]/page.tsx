/** Organizer portal root — the shows list is the landing surface. */
import { redirect } from "next/navigation";

export default async function OrganizerRootPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  redirect(`/organizers/${slug}/shows`);
}
