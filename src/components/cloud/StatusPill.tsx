/**
 * Class-based status pill for the Cloud design system.
 *
 * Tones are built on the semantic status tokens (success / info / warning /
 * destructive / primary) with translucent fills + mid-weight text, so they
 * read correctly in BOTH Ink (default) and `.theme-light` (Ink Light)
 * without relying on Tailwind `dark:` variants. Status colors carry
 * information — they are never replaced with the brand gradient.
 */
import {
  AlertCircle,
  CheckCircle2,
  Circle,
  Clock,
  Radio,
  type LucideIcon,
  XCircle,
} from "lucide-react";

import { cn } from "@/lib/utils";

export type StatusTone =
  | "approved"
  | "pending"
  | "needs-info"
  | "rejected"
  | "neutral"
  | "fixing"
  | "live";

const TONE_CLASSES: Record<StatusTone, string> = {
  approved: "bg-success/15 text-success border-success/30",
  pending: "bg-info/15 text-info border-info/30",
  "needs-info": "bg-warning/15 text-warning border-warning/30",
  rejected: "bg-destructive/15 text-destructive border-destructive/30",
  neutral: "bg-muted text-muted-foreground border-border",
  fixing: "bg-foreground text-background border-foreground",
  live: "bg-primary/15 text-primary border-primary/30",
};

const TONE_ICONS: Record<StatusTone, LucideIcon> = {
  approved: CheckCircle2,
  pending: Clock,
  "needs-info": AlertCircle,
  rejected: XCircle,
  neutral: Circle,
  fixing: Circle,
  live: Radio,
};

export function StatusPill({
  label,
  tone,
  icon,
  size = "sm",
  className,
}: {
  label: string;
  tone: StatusTone;
  icon?: LucideIcon | null;
  size?: "sm" | "md";
  className?: string;
}) {
  const Icon = icon === null ? null : (icon ?? TONE_ICONS[tone]);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border font-medium",
        size === "md" ? "px-2.5 py-1 text-xs" : "px-2 py-0.5 text-[11px]",
        TONE_CLASSES[tone],
        className
      )}
    >
      {Icon ? (
        <Icon
          className={cn(
            size === "md" ? "h-3.5 w-3.5" : "h-3 w-3",
            tone === "live" && "animate-pulse"
          )}
          aria-hidden
        />
      ) : null}
      {label}
    </span>
  );
}
