/** Per-event Bright.Studio storefront — tiers, existing requests, and pricing. */
import { notFound, redirect } from "next/navigation";
import { Sparkles, ImageIcon, Film, AlertTriangle, Palette } from "lucide-react";

import { EventPageShell } from "@/components/brand/event-page-shell";
import { EditorialEyebrow, Hairline } from "@/components/brand";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatUSDFromCents } from "@/lib/currency";
import { StudioTierCard } from "@/components/studio/StudioServiceCard";
import { StudioRequestActions } from "@/components/studio/StudioRequestActions";

import { getEventById } from "@/lib/queries/events";
import { getStudioRequestsByEvent } from "@/lib/queries/studio";
import { getAllStudioPricing } from "@/lib/queries/studio-pricing";
import { getUnreadCount } from "@/lib/queries/notifications";
import { getUser } from "@/lib/auth";
import { isInternalRole, canReviewCreativeAssets } from "@/lib/roles";
import { canViewSection } from "@/lib/event-access";
import type { StudioRequest } from "@/types";
import { timeSince } from "@/lib/dates";

const STATUS_VARIANTS: Record<
  string,
  { label: string; variant: "default" | "info" | "success" | "warning" | "muted" }
> = {
  draft: { label: "Draft", variant: "muted" },
  submitted: { label: "Submitted", variant: "info" },
  quoted: { label: "Quoted", variant: "warning" },
  approved: { label: "Approved", variant: "success" },
  confirmed: { label: "Confirmed", variant: "success" },
  in_progress: { label: "In progress", variant: "info" },
  delivered: { label: "Delivered", variant: "success" },
  cancelled: { label: "Cancelled", variant: "muted" },
};

export default async function StudioEventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getUser();
  if (!user) redirect("/login");
  const { id } = await params;
  if (!canViewSection(user.role, "studio")) redirect(`/events/${id}`);
  const [event, requests, unread, pricing] = await Promise.all([
    getEventById(id),
    getStudioRequestsByEvent(id),
    getUnreadCount(user.id),
    getAllStudioPricing(),
  ]);
  if (!event) return notFound();

  const isInternal = isInternalRole(user.role);
  // Only the Creative team can action a studio order's lifecycle. Other
  // internal roles (events lead, ops) get read-only visibility — otherwise the
  // page offers buttons the server action will reject.
  const canManageStudio = canReviewCreativeAssets(user.role);

  return (
    <EventPageShell
      event={event}
      user={user}
      unreadCount={unread}
      section="Bright.Studio"
      slug="studio"
      title="Bright.Studio."
      subtitle={
        isInternal
          ? "Creative service orders for this event — review the tiers, manage requests, and move work through the studio."
          : "Professional creative services to elevate your event — pick a tier and we'll get started."
      }
      isInternal={isInternal}
      viewerRole={user.role}
      heroRight={
        <div className="inline-flex items-center gap-1.5 text-overline text-[var(--color-bb-cobalt)]">
          <Sparkles size={12} /> Creative services
        </div>
      }
    >
      {requests.length > 0 ? (
        <>
          <section className="py-8">
            <EditorialEyebrow accent>Your requests</EditorialEyebrow>
            <ul className="mt-4 flex flex-col divide-y divide-border/40 border-t border-b border-border/40">
              {requests.map((req) => (
                <RequestRow
                  key={req.id}
                  request={req}
                  eventId={id}
                  canManage={canManageStudio}
                />
              ))}
            </ul>
          </section>
          <Hairline className="opacity-60" />
        </>
      ) : (
        <section className="py-8">
          <EmptyState
            icon={Palette}
            title="No studio requests yet"
            description={
              isInternal
                ? "No studio requests for this event yet. Customer-submitted requests will appear here for the creative team to action."
                : "Pick a tier below and submit your first request — our creative team will take it from there."
            }
            tone="flat"
            size="sm"
          />
        </section>
      )}

      <section className="py-8">
        <div className="flex items-baseline gap-2 mb-1">
          <ImageIcon size={14} className="text-muted-foreground" />
          <EditorialEyebrow>Static visuals</EditorialEyebrow>
        </div>
        <p className="text-overline text-muted-foreground mb-5">
          Pricing for static visuals only · Turnaround under 7 days may incur express fees
        </p>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {pricing.design.map((tier, i) => (
            <StudioTierCard key={tier.id} tier={tier} eventId={id} index={i} />
          ))}
        </div>
      </section>

      <Hairline className="opacity-60" />

      <section className="py-8">
        <div className="flex items-baseline gap-2 mb-1">
          <Film size={14} className="text-muted-foreground" />
          <EditorialEyebrow>Motion visuals</EditorialEyebrow>
        </div>
        <p className="text-overline text-muted-foreground mb-5">
          Video duration 10–30 sec · Standard lead time 7 working days · Express incurs 50% fee
        </p>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {pricing.animation.map((tier, i) => (
            <StudioTierCard key={tier.id} tier={tier} eventId={id} index={i + 3} />
          ))}
        </div>
      </section>

      <Hairline className="opacity-60" />

      <section className="py-6">
        <div className="border-l-2 border-border/60 pl-4 py-1">
          <p className="text-overline text-muted-foreground inline-flex items-center gap-1.5 mb-1">
            <AlertTriangle size={12} /> Fine print
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-[60ch]">
            All prices exclude VAT. Express turnaround (under 7 working days)
            incurs a 50% surcharge. Quoted prices are per individual asset.
            Complex or multi-asset projects receive a custom quote within 24
            hours of submission.
          </p>
        </div>
      </section>
    </EventPageShell>
  );
}

function RequestRow({
  request,
  eventId,
  canManage,
}: {
  request: StudioRequest;
  eventId: string;
  canManage: boolean;
}) {
  const status = STATUS_VARIANTS[request.status] ?? STATUS_VARIANTS.draft;
  return (
    <li className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3 py-4 px-2 items-start">
      <div className="min-w-0">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <h3 className="text-sm font-semibold text-foreground">
            {request.title}
          </h3>
          <Badge variant={status.variant}>{status.label}</Badge>
        </div>
        {request.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 leading-snug">
            {request.description}
          </p>
        )}
        {request.quotedCost && (
          <p className="mt-1.5 text-overline text-muted-foreground">
            Quote{" "}
            <span className="text-foreground font-semibold">
              {formatUSDFromCents(request.quotedCost, { decimals: true })}
            </span>
            {request.quotedDays && (
              <>
                <span className="opacity-60"> · </span>
                {request.quotedDays} working days
              </>
            )}
          </p>
        )}
        {canManage && (
          <StudioRequestActions
            requestId={request.id}
            eventId={eventId}
            currentStatus={request.status}
          />
        )}
      </div>
      <span className="text-overline text-muted-foreground shrink-0 whitespace-nowrap">
        {timeSince(request.createdAt)}
      </span>
    </li>
  );
}
