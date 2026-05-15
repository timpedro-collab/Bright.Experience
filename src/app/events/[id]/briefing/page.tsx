import { notFound, redirect } from "next/navigation";
import { FileText } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { EventContextBar } from "@/components/events/EventContextBar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BriefingForm } from "@/components/briefing/BriefingForm";
import { getEventById } from "@/lib/queries/events";
import { getUnreadCount } from "@/lib/queries/notifications";
import { getUser } from "@/lib/auth";
import { isInternalRole } from "@/lib/roles";
import { createClient } from "@/lib/supabase/server";

export default async function BriefingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getUser();
  if (!user) redirect("/login");
  const { id } = await params;
  const [event, unread] = await Promise.all([
    getEventById(id),
    getUnreadCount(user.id),
  ]);
  const isInternal = isInternalRole(user.role);
  if (!event) return notFound();

  const supabase = await createClient();
  const { data: briefing } = await supabase
    .from("briefing_responses")
    .select("*")
    .eq("event_id", id)
    .eq("form_type", "creative")
    .maybeSingle();

  return (
    <AppShell
      eventId={id}
      user={user}
      isInternal={isInternal}
      notificationCount={unread}
    >
      <EventContextBar event={event} currentSection="Briefing" />
      <PageHeader
        eyebrow="Tell us your story"
        title="Creative briefing"
        subtitle="Help our creative team design the perfect experience by sharing your brand and vision."
        actions={
          <Badge variant={briefing?.is_submitted ? "success" : "muted"}>
            <FileText className="size-3" />
            {briefing?.is_submitted ? "Submitted" : "Draft"}
          </Badge>
        }
      />

      <div className="max-w-3xl">
        <Card
          tone="subtle"
          className="mb-6 p-6 bg-gradient-to-br from-primary/10 to-transparent border-primary/20"
        >
          <p className="text-sm text-muted-foreground leading-relaxed">
            This briefing helps our creative team design the perfect experience
            for your event. Answer as many questions as you can — you can save
            your progress and come back later.
          </p>
        </Card>

        <BriefingForm
          eventId={id}
          initialResponses={briefing?.responses ?? {}}
          isSubmitted={briefing?.is_submitted ?? false}
        />
      </div>
    </AppShell>
  );
}
