/** Domain-specific status badge variants built on shadcn Badge */
import { cn } from "@/lib/utils";
import type {
  HealthStatus,
  Stage,
  TaskStatus,
  AssetStatus,
  ApprovalStatus,
  MilestoneStatus,
} from "@/types";
import { STAGE_CONFIG, HEALTH_CONFIG } from "@/types";

type BadgeVariant = "green" | "amber" | "red" | "blue" | "muted";

const VARIANT_STYLES: Record<BadgeVariant, string> = {
  green: "bg-success/12 text-success border-success/25",
  amber: "bg-warning/12 text-warning border-warning/25",
  red: "bg-destructive/12 text-destructive border-destructive/25",
  blue: "bg-brand/12 text-brand border-brand/25",
  muted: "bg-text-muted/15 text-text-secondary border-text-muted/25",
};

function StatusBadge({
  variant,
  children,
  className,
}: {
  variant: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-[var(--radius-chip)] border px-2 py-0.5",
        "font-[var(--font-overline)] text-[0.625rem] font-semibold uppercase tracking-wider",
        VARIANT_STYLES[variant],
        className
      )}
    >
      {children}
    </span>
  );
}

const TASK_STATUS_MAP: Record<TaskStatus, { label: string; variant: BadgeVariant }> = {
  pending: { label: "Pending", variant: "muted" },
  in_progress: { label: "In Progress", variant: "blue" },
  complete: { label: "Complete", variant: "green" },
  blocked: { label: "Blocked", variant: "red" },
  skipped: { label: "Skipped", variant: "muted" },
};

const ASSET_STATUS_MAP: Record<AssetStatus, { label: string; variant: BadgeVariant }> = {
  required: { label: "Required", variant: "amber" },
  uploaded: { label: "Uploaded", variant: "blue" },
  under_review: { label: "Under Review", variant: "blue" },
  accepted: { label: "Accepted", variant: "green" },
  rejected: { label: "Rejected", variant: "red" },
};

const APPROVAL_STATUS_MAP: Record<ApprovalStatus, { label: string; variant: BadgeVariant }> = {
  pending: { label: "Pending", variant: "amber" },
  approved: { label: "Approved", variant: "green" },
  rejected: { label: "Rejected", variant: "red" },
  revision_requested: { label: "Revision Requested", variant: "amber" },
};

const MILESTONE_STATUS_MAP: Record<MilestoneStatus, { label: string; variant: BadgeVariant }> = {
  pending: { label: "Upcoming", variant: "muted" },
  in_progress: { label: "In Progress", variant: "blue" },
  complete: { label: "Complete", variant: "green" },
  skipped: { label: "Skipped", variant: "muted" },
};

export function HealthBadge({ status }: { status: HealthStatus }) {
  const config = HEALTH_CONFIG[status];
  const variant: BadgeVariant = status === "green" ? "green" : status === "amber" ? "amber" : "red";
  return (
    <StatusBadge variant={variant}>
      <span className={cn("inline-block h-1.5 w-1.5 rounded-full", {
        "bg-success": status === "green",
        "bg-warning": status === "amber",
        "bg-destructive": status === "red",
      })} />
      {config.label}
    </StatusBadge>
  );
}

export function StageBadge({ stage }: { stage: Stage }) {
  return <StatusBadge variant="blue">{STAGE_CONFIG[stage].shortLabel}</StatusBadge>;
}

export function TaskStatusBadge({ status }: { status: TaskStatus }) {
  const config = TASK_STATUS_MAP[status];
  return <StatusBadge variant={config.variant}>{config.label}</StatusBadge>;
}

export function AssetStatusBadge({ status }: { status: AssetStatus }) {
  const config = ASSET_STATUS_MAP[status];
  return <StatusBadge variant={config.variant}>{config.label}</StatusBadge>;
}

export function ApprovalStatusBadge({ status }: { status: ApprovalStatus }) {
  const config = APPROVAL_STATUS_MAP[status];
  return <StatusBadge variant={config.variant}>{config.label}</StatusBadge>;
}

export function MilestoneStatusBadge({ status }: { status: MilestoneStatus }) {
  const config = MILESTONE_STATUS_MAP[status];
  return <StatusBadge variant={config.variant}>{config.label}</StatusBadge>;
}
