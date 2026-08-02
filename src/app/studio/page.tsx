/** Studio creative-services work queue — internal admin landing for orders */
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Sparkles,
  Clock,
  CheckCircle2,
  Play,
  Truck,
  XCircle,
  ExternalLink,
  Image as ImageIcon,
  Film,
  FileText,
  ThumbsUp,
} from "lucide-react";

import { AdminPageShell, EditorialEyebrow, Hairline } from "@/components/brand";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/ui/stat-card";
import { EmptyState } from "@/components/ui/EmptyState";
import { StudioRequestActions } from "@/components/studio/StudioRequestActions";

import { getAllStudioRequests } from "@/lib/queries/studio";
import type { StudioRequestWithContext } from "@/lib/queries/studio";
import { getUnreadCount } from "@/lib/queries/notifications";
import { getUser } from "@/lib/auth";
import { canViewCreativeProduct } from "@/lib/roles";
import { TimeAgo } from "@/components/ui/TimeAgo";

const STATUS_CONFIG: Record<
  string,
  { label: string; variant: "info" | "default" | "warning" | "success" | "muted"; Icon: React.ElementType }
> = {
  submitted: { label: "New", variant: "info", Icon: Clock },
  quoted: { label: "Quoted", variant: "info", Icon: FileText },
  approved: { label: "Approved", variant: "default", Icon: ThumbsUp },
  confirmed: { label: "Confirmed", variant: "default", Icon: CheckCircle2 },
  in_progress: { label: "In progress", variant: "warning", Icon: Play },
  delivered: { label: "Delivered", variant: "success", Icon: Truck },
  cancelled: { label: "Cancelled", variant: "muted", Icon: XCircle },
};

export default async function StudioDashboardPage() {
  const user = await getUser();
  if (!user) redirect("/login");
  if (!canViewCreativeProduct(user.role)) redirect("/");

  const [requests, unread] = await Promise.all([
    getAllStudioRequests(),
    getUnreadCount(user.id),
  ]);

  const actionable = requests.filter(
    (r) =>
      r.status === "submitted" ||
      r.status === "quoted" ||
      r.status === "approved" ||
      r.status === "confirmed" ||
      r.status === "in_progress"
  );
  const completed = requests.filter(
    (r) => r.status === "delivered" || r.status === "cancelled"
  );

  const newCount = requests.filter(
    (r) => r.status === "submitted" || r.status === "quoted"
  ).length;
  const inProgressCount = requests.filter(
    (r) =>
      r.status === "in_progress" ||
      r.status === "confirmed" ||
      r.status === "approved"
  ).length;
  const deliveredCount = requests.filter((r) => r.status === "delivered").length;

  return (
    <AdminPageShell
      user={user}
      unreadCount={unread}
      section="Studio"
      eyebrow="Internal · Bright.Studio"
      title="Creative services."
      subtitle="Manage creative orders submitted by customers and internal teams."
      heroRight={
        newCount > 0 ? (
          <div className="text-overline text-muted-foreground tabular-nums">
            <span className="text-[var(--color-bb-cobalt)] text-base font-semibold">
              {newCount}
            </span>{" "}
            new
          </div>
        ) : null
      }
    >
      {newCount > 0 && (
        <section className="py-8 grid grid-cols-1 md:grid-cols-[1fr_auto] gap-4 items-end">
          <div>
            <EditorialEyebrow accent>Action needed</EditorialEyebrow>
            <h2 className="text-heading text-foreground text-[clamp(1.5rem,3vw,2.25rem)] leading-tight mt-2">
              {newCount} new request{newCount === 1 ? "" : "s"} awaiting confirmation
            </h2>
            <p className="mt-2 text-sm text-muted-foreground max-w-[60ch]">
              Review and confirm orders to keep creative work moving on schedule.
            </p>
          </div>
          <a
            href="#actionable"
            className="inline-flex items-center gap-2 bg-[var(--color-bb-cobalt)] text-white px-5 py-2.5 rounded-sm text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Jump to new
          </a>
        </section>
      )}

      {newCount > 0 && <Hairline className="opacity-60" />}

      <div className="py-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="New"
          value={newCount}
          tone="info"
          icon={Clock}
        />
        <StatCard
          label="In progress"
          value={inProgressCount}
          tone="warning"
          icon={Play}
        />
        <StatCard
          label="Delivered"
          value={deliveredCount}
          tone="success"
          icon={Truck}
        />
        <StatCard
          label="Total"
          value={requests.length}
          tone="default"
          icon={Sparkles}
        />
      </div>

      {requests.length === 0 ? (
        <EmptyState
          icon={Sparkles}
          title="No studio orders yet"
          description="When a customer submits a creative request, it'll appear here for your team to action."
          size="lg"
        />
      ) : (
        <>
          {actionable.length > 0 && (
            <section id="actionable" className="mb-8 scroll-mt-24">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-overline text-muted-foreground">
                  Requires action ({actionable.length})
                </h2>
              </div>
              <div className="space-y-3">
                {actionable.map((req, i) => (
                  <RequestRow key={req.id} request={req} index={i} />
                ))}
              </div>
            </section>
          )}

          {completed.length > 0 && (
            <section>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-overline text-muted-foreground">
                  Completed ({completed.length})
                </h2>
              </div>
              <div className="space-y-3">
                {completed.map((req, i) => (
                  <RequestRow
                    key={req.id}
                    request={req}
                    index={i + actionable.length}
                  />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </AdminPageShell>
  );
}

function RequestRow({
  request,
  index,
}: {
  request: StudioRequestWithContext;
  index: number;
}) {
  const status = STATUS_CONFIG[request.status] ?? STATUS_CONFIG.submitted;
  const StatusIcon = status.Icon;
  const isDesign = request.serviceType === "design";

  return (
    <Card
      tone="subtle"
      className="stagger-item"
      style={{ "--stagger-index": index } as React.CSSProperties}
    >
      <CardContent className="flex items-start gap-4 p-5">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-control)] border border-border/60 bg-muted/40">
          {isDesign ? (
            <ImageIcon size={18} className="text-info" />
          ) : (
            <Film size={18} className="text-info" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-semibold text-foreground">
              {request.title}
            </h3>
            <Badge variant={status.variant} className="capitalize">
              <StatusIcon size={11} />
              {status.label}
            </Badge>
          </div>

          <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span>{request.accountName}</span>
            <span aria-hidden>·</span>
            <Link
              href={`/events/${request.eventId}/studio`}
              className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
            >
              {request.eventName}
              <ExternalLink size={10} />
            </Link>
            {request.createdByName && (
              <>
                <span aria-hidden>·</span>
                <span>by {request.createdByName}</span>
              </>
            )}
            <span aria-hidden>·</span>
            <span><TimeAgo dateStr={request.createdAt} /></span>
          </div>

          {request.description && (
            <p className="mt-1 line-clamp-2 whitespace-pre-line text-xs text-foreground/70">
              {request.description}
            </p>
          )}

          <div className="mt-3">
            <StudioRequestActions
              requestId={request.id}
              eventId={request.eventId}
              currentStatus={request.status}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
