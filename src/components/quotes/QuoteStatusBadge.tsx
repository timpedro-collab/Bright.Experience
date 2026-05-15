/** Badge displaying quote lifecycle status with contextual colours */
import { cn } from "@/lib/utils";
import type { QuoteStatus } from "@/types";

type BadgeVariant = "green" | "amber" | "red" | "blue" | "muted";

const STATUS_MAP: Record<QuoteStatus, { label: string; variant: BadgeVariant }> = {
  draft: { label: "Draft", variant: "muted" },
  submitted: { label: "Submitted", variant: "blue" },
  proposal_sent: { label: "Proposal Sent", variant: "amber" },
  accepted: { label: "Accepted", variant: "green" },
  declined: { label: "Declined", variant: "red" },
  expired: { label: "Expired", variant: "muted" },
};

const VARIANT_STYLES: Record<BadgeVariant, string> = {
  green: "bg-success/12 text-success border-success/25",
  amber: "bg-warning/12 text-warning border-warning/25",
  red: "bg-destructive/12 text-destructive border-destructive/25",
  blue: "bg-brand/12 text-brand border-brand/25",
  muted: "bg-text-muted/15 text-text-secondary border-text-muted/25",
};

interface QuoteStatusBadgeProps {
  status: QuoteStatus;
  className?: string;
}

/** Renders a compact status badge for a quote. */
export function QuoteStatusBadge({ status, className }: QuoteStatusBadgeProps) {
  const config = STATUS_MAP[status];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-[var(--radius-chip)] border px-2 py-0.5",
        "font-[var(--font-overline)] text-[0.625rem] font-semibold uppercase tracking-wider",
        VARIANT_STYLES[config.variant],
        className
      )}
    >
      {config.label}
    </span>
  );
}
