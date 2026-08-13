/**
 * /events/[id]/messages → /events/[id]/communications.
 *
 * The tab is labelled "Messages" but the section route is `communications`,
 * so "messages" is the URL people guess and share. Production audit found it
 * 404ing; a permanent redirect keeps the guessable URL working.
 */
import { permanentRedirect } from "next/navigation";

export default async function MessagesRedirect({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  permanentRedirect(`/events/${id}/communications`);
}
