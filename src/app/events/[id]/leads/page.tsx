/** Leads — list of all captured leads for an event with metrics summary. */
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { Users, TrendingUp, Star, Clock } from "lucide-react";

import { EventPageShell } from "@/components/brand/event-page-shell";
import { EditorialEyebrow, Hairline } from "@/components/brand";
import { MetricCard } from "@/components/telemetry/MetricCard";
import { LeadTable } from "@/components/telemetry/LeadTable";
import { AudienceDemographicsCard } from "@/components/reports/EngagementReport";
import { LeadQualityCard } from "@/components/leads/LeadQualityCard";
import { LeadWebhookManager } from "@/components/leads/LeadWebhookManager";
import { ExportMenu } from "@/components/ui/ExportMenu";

import { getUser } from "@/lib/auth";
import { isInternalRole } from "@/lib/roles";
import { canViewSection } from "@/lib/event-access";
import { getEventById } from "@/lib/queries/events";
import {
  getLeadsByEventPaginated,
  getLeadCount,
  getLeadAggregates,
} from "@/lib/queries/leads";
import { getLeadQualitySummary } from "@/lib/queries/lead-quality";
import { getLeadWebhooksForEvent } from "@/app/actions/lead-webhooks";
import { getUnreadCount } from "@/lib/queries/notifications";
import { parsePage } from "@/lib/pagination";
import { Pagination } from "@/components/ui/Pagination";
import { entityTitle, getEventNameForTitle } from "@/lib/queries/page-titles";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  return { title: entityTitle("Leads", await getEventNameForTitle(id)) };
}

export default async function LeadsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await getUser();
  if (!user) redirect("/login");
  const { id } = await params;
  if (!canViewSection(user.role, "leads")) redirect(`/events/${id}`);
  const sp = await searchParams;
  const page = parsePage(sp);

  const [event, leadsResult, leadCount, aggregates, unread, quality, webhooks] =
    await Promise.all([
      getEventById(id),
      getLeadsByEventPaginated(id, page),
      getLeadCount(id),
      getLeadAggregates(id),
      getUnreadCount(user.id),
      getLeadQualitySummary(id),
      getLeadWebhooksForEvent(id),
    ]);
  if (!event) return notFound();

  const leads = leadsResult.data;

  const todaysLeads = aggregates.today;
  const topSource = aggregates.topSource;

  const tableLeads = leads.map(
    (l: {
      id: string;
      contact_name: string;
      contact_email: string;
      contact_phone?: string;
      source: string;
      captured_at: string;
      custom_fields_json?: { age?: number } | null;
    }) => ({
      id: l.id,
      contactName: l.contact_name,
      contactEmail: l.contact_email,
      contactPhone: l.contact_phone,
      source: l.source,
      capturedAt: l.captured_at,
      age:
        typeof l.custom_fields_json?.age === "number"
          ? l.custom_fields_json.age
          : null,
    }),
  );

  // Age split for the audience card (matches the post-event report demographics).
  const ageDemographics: Record<string, number> = Object.fromEntries(
    aggregates.ageBands.map((b) => [b.band, b.pct]),
  );

  return (
    <EventPageShell
      event={event}
      user={user}
      unreadCount={unread}
      section="Leads"
      title="Captured leads."
      subtitle={`${leadCount} contacts captured.${todaysLeads > 0 ? ` ${todaysLeads} from today.` : " Pull in more by sharing the live link."}`}
      isInternal={isInternalRole(user.role)}
      heroRight={<ExportMenu eventId={id} view="leads" />}
    >
      <section className="py-8">
        <EditorialEyebrow accent>The headlines</EditorialEyebrow>
        <div className="mt-4 grid grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            label="Total leads"
            value={leadCount}
            icon={<Users size={20} />}
          />
          <MetricCard
            label="Today's leads"
            value={todaysLeads}
            icon={<TrendingUp size={20} />}
          />
          <MetricCard
            label="Top source"
            value={topSource}
            icon={<Star size={20} />}
          />
          <MetricCard
            label={aggregates.avgAge != null ? "Average age" : "Avg per hour"}
            value={
              aggregates.avgAge != null
                ? `${aggregates.avgAge} yrs`
                : aggregates.perHour > 0
                  ? aggregates.perHour
                  : "—"
            }
            icon={<Clock size={20} />}
          />
        </div>
      </section>

      {(aggregates.ageBands.length > 0 || quality.total > 0) && (
        <>
          <Hairline className="opacity-60" />
          <section className="py-8">
            <EditorialEyebrow>Quality &amp; audience</EditorialEyebrow>
            <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-6">
              {quality.total > 0 && <LeadQualityCard summary={quality} />}
              {aggregates.ageBands.length > 0 && (
                <AudienceDemographicsCard demographics={ageDemographics} />
              )}
            </div>
          </section>
        </>
      )}

      <Hairline className="opacity-60" />

      <section className="py-8">
        <EditorialEyebrow>Every lead</EditorialEyebrow>
        <div className="mt-4">
          <LeadTable leads={tableLeads} />
        </div>
        <Pagination
          currentPage={page}
          totalPages={leadsResult.totalPages}
          basePath={`/events/${id}/leads`}
        />
      </section>

      <Hairline className="opacity-60" />

      <section className="py-8">
        <EditorialEyebrow>Real-time delivery</EditorialEyebrow>
        <p className="mt-1 mb-4 text-sm text-muted-foreground max-w-[58ch]">
          Send each lead to your CRM the moment it&apos;s captured — signed,
          instant, before the stand packs down.
        </p>
        <LeadWebhookManager
          eventId={id}
          webhooks={webhooks.success ? webhooks.data : []}
        />
      </section>
    </EventPageShell>
  );
}
