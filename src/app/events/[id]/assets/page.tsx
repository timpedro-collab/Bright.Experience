import { notFound, redirect } from "next/navigation";
import {
  Upload,
  FileImage,
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { EventContextBar } from "@/components/events/EventContextBar";
import { Card } from "@/components/ui/card";
import { AssetStatusBadge } from "@/components/ui/StatusBadge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { EmptyState } from "@/components/ui/EmptyState";
import { getEventById } from "@/lib/queries/events";
import { getAssetsByEvent } from "@/lib/queries/assets";
import { getUnreadCount } from "@/lib/queries/notifications";
import { getUser } from "@/lib/auth";
import { isInternalRole } from "@/lib/roles";
import { AssetUploadButton } from "@/components/assets/AssetUploadButton";
import { AssetReviewBadge } from "@/components/assets/AssetReviewBadge";
import type { Asset } from "@/types";
import { formatDateShort, isOverdue as checkOverdue } from "@/lib/dates";

function formatFileSize(bytes?: number): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getAssetIcon(assetType: string) {
  switch (assetType) {
    case "logo":
    case "imagery":
      return FileImage;
    default:
      return FileText;
  }
}

export default async function AssetsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getUser();
  if (!user) redirect("/login");
  const { id } = await params;
  const [event, assets, unread] = await Promise.all([
    getEventById(id),
    getAssetsByEvent(id),
    getUnreadCount(user.id),
  ]);
  const isInternal = isInternalRole(user.role);
  if (!event) return notFound();

  const accepted = assets.filter((a) => a.status === "accepted").length;
  const required = assets.filter((a) => a.status === "required").length;

  if (assets.length === 0) {
    return (
      <AppShell
        eventId={id}
        user={user}
        isInternal={isInternal}
        notificationCount={unread}
      >
        <EventContextBar event={event} currentSection="Assets" />
        <PageHeader
          eyebrow="Creative & brand"
          title="Assets"
          subtitle="Upload your brand materials and creative assets here."
        />
        <EmptyState
          icon={Upload}
          title="No assets required yet"
          description="Asset requirements will appear here once your event reaches the creative stage."
          action={{ label: "View timeline", href: `/events/${id}/timeline` }}
        />
      </AppShell>
    );
  }

  return (
    <AppShell
      eventId={id}
      user={user}
      isInternal={isInternal}
      notificationCount={unread}
    >
      <EventContextBar event={event} currentSection="Assets" />
      <PageHeader
        eyebrow="Creative & brand"
        title="Assets"
        subtitle={
          required > 0
            ? `${required} asset${required === 1 ? "" : "s"} still need uploading. Drop them in below to keep your build on track.`
            : "All assets accepted. We'll let you know if anything else is needed."
        }
      />

      <Card tone="subtle" className="mb-6 p-6">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-heading text-base font-semibold text-foreground">
              Asset progress
            </h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              {required} item{required === 1 ? "" : "s"} still needed
            </p>
          </div>
          <span className="text-heading text-2xl font-bold tabular-nums text-primary">
            {accepted}
            <span className="text-muted-foreground text-base font-normal">
              /{assets.length}
            </span>
          </span>
        </div>
        <ProgressBar value={accepted} max={assets.length} size="md" />
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {assets.map((asset, i) => (
          <AssetCard key={asset.id} asset={asset} index={i} />
        ))}
      </div>
    </AppShell>
  );
}

function AssetCard({ asset, index }: { asset: Asset; index: number }) {
  const Icon = getAssetIcon(asset.assetType);
  const isUploaded = asset.status !== "required";
  const overdue =
    asset.status === "required" &&
    asset.dueDate &&
    checkOverdue(asset.dueDate);

  return (
    <Card
      tone="subtle"
      className={`stagger-item p-5 ${overdue ? "border-destructive/40 shadow-[inset_3px_0_0_0_hsl(0,84%,60%)]" : ""}`}
      style={{ "--stagger-index": index } as React.CSSProperties}
    >
      <div className="flex items-start gap-4">
        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-[var(--radius-control)] ${
            isUploaded
              ? "bg-success/10 border border-success/20"
              : "bg-white/[0.04] border border-white/[0.06]"
          }`}
        >
          {asset.status === "accepted" ? (
            <CheckCircle2 size={20} className="text-success" />
          ) : asset.status === "rejected" ? (
            <XCircle size={20} className="text-destructive" />
          ) : (
            <Icon size={20} className="text-text-muted" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-3 mb-1">
            <h3 className="text-sm font-semibold text-text-primary truncate">
              {asset.name}
            </h3>
            <div className="flex shrink-0 items-center gap-2">
              <AssetReviewBadge
                reviewStatus={asset.reviewStatus}
                hasUpload={Boolean(asset.fileUrl)}
              />
              <AssetStatusBadge status={asset.status} />
            </div>
          </div>

          {asset.description && (
            <p className="text-xs text-text-muted mb-2 line-clamp-2">
              {asset.description}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            {asset.requiredFormat && (
              <span className="text-xs text-text-secondary">
                Format: {asset.requiredFormat}
              </span>
            )}
            {asset.requiredDimensions && (
              <span className="text-xs text-text-secondary">
                Size: {asset.requiredDimensions}
              </span>
            )}
          </div>

          <div className="flex items-center gap-4 mt-2">
            {asset.dueDate && (
              <span
                className={`flex items-center gap-1 text-xs ${
                  overdue ? "text-destructive" : "text-text-muted"
                }`}
              >
                {overdue ? (
                  <AlertCircle size={11} />
                ) : (
                  <Clock size={11} />
                )}
                {overdue ? "Overdue: " : "Due: "}
                {formatDateShort(asset.dueDate!)}
              </span>
            )}
            {asset.fileName && (
              <span className="text-xs text-text-muted truncate">
                {asset.fileName}
                {asset.fileSize ? ` (${formatFileSize(asset.fileSize)})` : ""}
              </span>
            )}
          </div>

          {asset.reviewFeedback &&
            asset.reviewStatus === "revision_requested" && (
              <div className="mt-3 rounded-xl border border-amber-300/20 bg-amber-300/[0.06] p-3">
                <p className="text-[11px] uppercase tracking-wider text-amber-300/90 font-semibold mb-1">
                  Note from Bright.Blue creative
                </p>
                <p className="text-xs text-foreground/90 whitespace-pre-line">
                  {asset.reviewFeedback}
                </p>
              </div>
            )}

          {(asset.status === "required" ||
            asset.reviewStatus === "revision_requested") && (
            <AssetUploadButton assetId={asset.id} eventId={asset.eventId} />
          )}
        </div>
      </div>
    </Card>
  );
}
