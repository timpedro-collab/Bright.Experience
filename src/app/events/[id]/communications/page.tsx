/** Per-event communications page with threaded messaging. */
import { notFound, redirect } from "next/navigation";

import { EventPageShell } from "@/components/brand";
import { MessageThread } from "@/components/messages/MessageThread";

import { getEventById } from "@/lib/queries/events";
import { getMessagesByEvent } from "@/lib/queries/messages";
import { getUnreadCount } from "@/lib/queries/notifications";
import { getUser } from "@/lib/auth";
import { isInternalRole } from "@/lib/roles";

export default async function CommunicationsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getUser();
  if (!user) redirect("/login");
  const { id } = await params;
  const [event, messages, unread] = await Promise.all([
    getEventById(id),
    getMessagesByEvent(id),
    getUnreadCount(user.id),
  ]);
  const isInternal = isInternalRole(user.role);
  if (!event) return notFound();

  return (
    <EventPageShell
      event={event}
      user={user}
      unreadCount={unread}
      section="Messages"
      title="The conversation."
      subtitle="Threaded messages keep the team aligned without endless email chains."
      isInternal={isInternal}
      viewerRole={user.role}
    >
      <section className="py-8">
        <MessageThread
          eventId={id}
          messages={messages}
          currentUserId={user.id}
          isInternal={isInternal}
        />
      </section>
    </EventPageShell>
  );
}
