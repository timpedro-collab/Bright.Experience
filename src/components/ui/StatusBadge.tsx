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
import {
  stageShortLabelFor,
  healthLabelFor,
} from "@/lib/customer-copy";

type BadgeVariant = "green" | "amber" | "red" | "blue" | "muted";

const VARIANT_STYLES: Record<BadgeVariant, string> = {
  green: "bg-success/15 text-success border-success/30",
  amber: "bg-warning/15 text-warning border-warning/30",
  red: "bg-destructive/15 text-destructive border-destructive/30",
  blue: "bg-primary/15 text-primary border-primary/30",
  muted: "bg-muted text-muted-foreground border-border",
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
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5",
        "text-[11px] font-medium",
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

export function HealthBadge({
  status,
  isCustomer = false,
}: {
  status: HealthStatus;
  isCustomer?: boolean;
}) {
  // Customers never see "Blocked"/"At Risk" or a destructive red dot — their
  // health reads as a calm "On track" / "In progress".
  const variant: BadgeVariant = isCustomer
    ? status === "green"
      ? "green"
      : "blue"
    : status === "green"
      ? "green"
      : status === "amber"
        ? "amber"
        : "red";
  return (
    <StatusBadge variant={variant}>
      <span
        className={cn("inline-block h-1.5 w-1.5 rounded-full", {
          "bg-success": variant === "green",
          "bg-warning": variant === "amber",
          "bg-destructive": variant === "red",
          "bg-primary": variant === "blue",
        })}
      />
      {healthLabelFor(status, isCustomer)}
    </StatusBadge>
  );
}

export function StageBadge({
  stage,
  isCustomer = false,
}: {
  stage: Stage;
  isCustomer?: boolean;
}) {
  return (
    <StatusBadge variant="blue">
      {stageShortLabelFor(stage, isCustomer)}
    </StatusBadge>
  );
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
