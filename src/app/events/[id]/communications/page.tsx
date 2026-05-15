/** Per-event communications page with threaded messaging */
import { notFound, redirect } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { EventContextBar } from "@/components/events/EventContextBar";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/EmptyState";
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
    <AppShell
      eventId={id}
      user={user}
      isInternal={isInternal}
      notificationCount={unread}
    >
      <EventContextBar event={event} currentSection="Communications" />
      <PageHeader
        eyebrow="Stay in sync"
        title="Communications"
        subtitle="Threaded messages keep the team aligned without endless email chains."
      />
      <Card tone="subtle" className="overflow-hidden">
        {messages.length === 0 ? (
          <EmptyState
            icon={MessageCircle}
            title="No messages yet"
            description="Start a conversation about this event. Messages keep everyone aligned without email chains."
          />
        ) : null}
        <MessageThread
          eventId={id}
          messages={messages}
          currentUserId={user.id}
          isInternal={isInternal}
        />
      </Card>
    </AppShell>
  );
}
