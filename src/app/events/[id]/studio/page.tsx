import { notFound, redirect } from "next/navigation";
import { Sparkles, Image, Film, Clock, AlertTriangle } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { EventContextBar } from "@/components/events/EventContextBar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StudioTierCard } from "@/components/studio/StudioServiceCard";
import type { StudioTier } from "@/components/studio/StudioServiceCard";
import { getEventById } from "@/lib/queries/events";
import { getStudioRequestsByEvent } from "@/lib/queries/studio";
import { getUnreadCount } from "@/lib/queries/notifications";
import { getUser } from "@/lib/auth";
import { isInternalRole } from "@/lib/roles";
import type { StudioRequest } from "@/types";
import { timeSince } from "@/lib/dates";

const STATIC_TIERS: StudioTier[] = [
  {
    id: "static-essential",
    serviceType: "design",
    name: "Essential Enhancements",
    subtitle: "Meets minimum asset standards",
    price: "£32",
    priceUnit: "Per Asset",
    features: [
      "Aspect Ratio Correction",
      "Size Compression",
      "Background Removal",
      "Colour Matching",
    ],
  },
  {
    id: "static-professional",
    serviceType: "design",
    name: "Professional Enhancements",
    subtitle: "Transforms assets with expert detail",
    price: "£72",
    priceUnit: "Per Asset",
    features: [
      "All in Essential",
      "Quality Boost",
      "Layout Adjustments",
      "Web Asset Sourcing",
      "Web Asset Adaptation",
    ],
    featured: true,
  },
  {
    id: "static-creation",
    serviceType: "design",
    name: "New Asset Creation",
    subtitle: "Original assets from the ground up",
    price: "£120",
    priceUnit: "Per Asset",
    features: [
      "All in Professional",
      "Concept Development",
      "Custom Graphics",
      "Brand Alignment",
      "Original Layouts",
      "Multi-Format Delivery",
    ],
  },
];

const VIDEO_TIERS: StudioTier[] = [
  {
    id: "video-essential",
    serviceType: "animation",
    name: "Essential Enhancements",
    subtitle: "Meets minimum motion standards",
    price: "£160",
    priceUnit: "Per Asset",
    features: [
      "Format Conversion",
      "Duration Trimming",
      "Resolution Adjustment",
      "Basic Colour Correction",
    ],
  },
  {
    id: "video-professional",
    serviceType: "animation",
    name: "Professional Enhancements",
    subtitle: "Elevates existing motion assets",
    price: "£480",
    priceUnit: "Per Asset",
    features: [
      "All in Essential",
      "Transition Effects",
      "Audio Sync",
      "Text Overlay",
      "Branded Elements",
    ],
    featured: true,
  },
  {
    id: "video-creation",
    serviceType: "animation",
    name: "New Asset Creation",
    subtitle: "Original motion from the ground up",
    price: "£1,080",
    priceUnit: "Per Asset",
    features: [
      "All in Professional",
      "Concept Development",
      "Custom Animation",
      "Brand Alignment",
      "Original Sequences",
      "Multi-Format Delivery",
    ],
  },
];

const STATUS_VARIANTS: Record<
  string,
  { label: string; variant: "default" | "info" | "success" | "warning" | "muted" }
> = {
  draft: { label: "Draft", variant: "muted" },
  submitted: { label: "Submitted", variant: "info" },
  quoted: { label: "Quoted", variant: "warning" },
  approved: { label: "Approved", variant: "success" },
  in_progress: { label: "In progress", variant: "info" },
  delivered: { label: "Delivered", variant: "success" },
  cancelled: { label: "Cancelled", variant: "muted" },
};

export default async function StudioPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getUser();
  if (!user) redirect("/login");
  const { id } = await params;
  const [event, requests, unread] = await Promise.all([
    getEventById(id),
    getStudioRequestsByEvent(id),
    getUnreadCount(user.id),
  ]);
  if (!event) return notFound();

  const isInternal = isInternalRole(user.role);

  return (
    <AppShell
      eventId={id}
      user={user}
      isInternal={isInternal}
      notificationCount={unread}
    >
      <EventContextBar event={event} currentSection="Bright.Studio" />
      <PageHeader
        eyebrow="Creative services"
        title="Bright.Studio"
        subtitle="Professional creative services to elevate your event — pick a tier and we'll get started."
      />

      <Card
        tone="subtle"
        className="p-8 mb-8 bg-gradient-to-br from-primary/10 to-transparent border-primary/20"
      >
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[var(--radius-control)] bg-primary/10 border border-primary/20">
            <Sparkles size={22} className="text-primary" />
          </div>
          <div>
            <h2 className="text-heading text-lg font-semibold text-foreground mb-1">
              Need creative support?
            </h2>
            <p className="text-sm text-muted-foreground max-w-lg">
              Bright.Studio handles everything from asset enhancements to
              original creative — for both static visuals and motion content.
              Select a tier below and we&apos;ll get started.
            </p>
          </div>
        </div>
      </Card>

      {requests.length > 0 && (
        <div className="mb-8">
          <h2 className="text-overline text-muted-foreground mb-4">Your requests</h2>
          <div className="space-y-3">
            {requests.map((req) => (
              <RequestCard key={req.id} request={req} />
            ))}
          </div>
        </div>
      )}

      <div className="mb-10">
        <div className="flex items-center gap-2 mb-1">
          <Image size={16} className="text-muted-foreground" />
          <h2 className="text-heading text-base font-semibold text-foreground">
            Static visuals
          </h2>
        </div>
        <p className="text-xs text-muted-foreground mb-5">
          Pricing for static visuals only. Turnaround under 7 days may incur
          expedited fees.
        </p>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {STATIC_TIERS.map((tier, i) => (
            <StudioTierCard key={tier.id} tier={tier} eventId={id} index={i} />
          ))}
        </div>
      </div>

      <div className="mb-10">
        <div className="flex items-center gap-2 mb-1">
          <Film size={16} className="text-muted-foreground" />
          <h2 className="text-heading text-base font-semibold text-foreground">
            Motion visuals
          </h2>
        </div>
        <p className="text-xs text-muted-foreground mb-5">
          Video asset duration 10–30 sec. Standard lead time is 7 working days.
          Turnaround under 7 days incurs a 50% express fee.
        </p>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {VIDEO_TIERS.map((tier, i) => (
            <StudioTierCard
              key={tier.id}
              tier={tier}
              eventId={id}
              index={i + 3}
            />
          ))}
        </div>
      </div>

      <div className="flex items-start gap-2 p-4 rounded-[var(--radius-control)] bg-white/[0.02] border border-white/[0.06]">
        <AlertTriangle size={14} className="text-muted-foreground mt-0.5 shrink-0" />
        <p className="text-xs text-muted-foreground leading-relaxed">
          All prices exclude VAT. Express turnaround (under 7 working days)
          incurs a 50% surcharge. Quoted prices are per individual asset.
          Complex or multi-asset projects will receive a custom quote within 24
          hours of submission.
        </p>
      </div>
    </AppShell>
  );
}

function RequestCard({ request }: { request: StudioRequest }) {
  const status = STATUS_VARIANTS[request.status] ?? STATUS_VARIANTS.draft;

  return (
    <Card tone="subtle" className="p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-sm font-semibold text-foreground truncate">
              {request.title}
            </h3>
            <Badge variant={status.variant}>{status.label}</Badge>
          </div>
          {request.description && (
            <p className="text-xs text-muted-foreground line-clamp-2">
              {request.description}
            </p>
          )}
        </div>
        <span className="text-overline text-muted-foreground shrink-0">
          {timeSince(request.createdAt)}
        </span>
      </div>
      {request.quotedCost && (
        <div className="mt-3 pt-3 border-t border-white/[0.06] flex items-center gap-4">
          <span className="text-xs text-muted-foreground">
            Quote:{" "}
            <span className="text-foreground font-semibold">
              £{request.quotedCost.toFixed(2)}
            </span>
          </span>
          {request.quotedDays && (
            <span className="text-xs text-muted-foreground">
              {request.quotedDays} working days
            </span>
          )}
        </div>
      )}
    </Card>
  );
}
