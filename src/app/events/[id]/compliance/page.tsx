/** Compliance document vault — insurance, DPA, RAMS, and certificates. */
import { notFound, redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";

import { EventPageShell, EditorialEyebrow } from "@/components/brand";
import { EmptyState } from "@/components/ui/EmptyState";
import { ComplianceChecklist } from "@/components/compliance/ComplianceChecklist";

import { getEventById } from "@/lib/queries/events";
import { getComplianceDocuments } from "@/app/actions/compliance";
import { getUnreadCount } from "@/lib/queries/notifications";
import { getUser } from "@/lib/auth";
import { isInternalRole } from "@/lib/roles";

export default async function CompliancePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getUser();
  if (!user) redirect("/login");
  const { id } = await params;

  const [event, documents, unread] = await Promise.all([
    getEventById(id),
    getComplianceDocuments(id),
    getUnreadCount(user.id),
  ]);
  if (!event) return notFound();

  const isInternal = isInternalRole(user.role);

  const approved = documents.filter((d) => d.status === "approved").length;
  const total = documents.length;
  const subtitle =
    total === 0
      ? "No compliance documents required for this event yet."
      : approved === total
        ? "All compliance documents approved. You're clear to advance."
        : `${approved} of ${total} documents approved. ${total - approved} still need attention.`;

  return (
    <EventPageShell
      event={event}
      user={user}
      unreadCount={unread}
      section="Compliance"
      title="Document vault."
      subtitle={subtitle}
      isInternal={isInternal}
      viewerRole={user.role}
      heroRight={
        total > 0 ? (
          <div className="text-overline text-muted-foreground tabular-nums">
            <span className="text-foreground text-base font-semibold">
              {approved}
            </span>
            <span className="opacity-60"> / {total} </span>
            approved
          </div>
        ) : null
      }
    >
      {total === 0 ? (
        <section className="py-8">
          <EmptyState
            icon={ShieldCheck}
            title="No compliance requirements"
            description={
              isInternal
                ? "Add compliance document requirements from the client's account profile, or add them manually below."
                : "No documents are required from you at this time. We'll let you know if anything changes."
            }
          />
          {isInternal && (
            <ComplianceChecklist
              eventId={id}
              documents={[]}
              isInternal={isInternal}
            />
          )}
        </section>
      ) : (
        <section className="py-8">
          <EditorialEyebrow accent>Document checklist</EditorialEyebrow>
          <div className="mt-4">
            <ComplianceChecklist
              eventId={id}
              documents={documents}
              isInternal={isInternal}
            />
          </div>
        </section>
      )}
    </EventPageShell>
  );
}
