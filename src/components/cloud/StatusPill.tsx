/**
 * Class-based status pill for the Cloud design system.
 *
 * Tones use translucent color fills + mid-weight text so they read correctly
 * in BOTH the default dark (Deep Ink) and `.theme-light` (Linen) palettes
 * without relying on Tailwind `dark:` variants.
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
  approved: "bg-emerald-500/15 text-emerald-500 border-emerald-500/30",
  pending: "bg-sky-500/15 text-sky-500 border-sky-500/30",
  "needs-info": "bg-amber-500/15 text-amber-500 border-amber-500/30",
  rejected: "bg-rose-500/15 text-rose-500 border-rose-500/30",
  neutral: "bg-muted text-muted-foreground border-border",
  fixing: "bg-foreground text-background border-foreground",
  live: "bg-indigo-500/15 text-indigo-400 border-indigo-500/30",
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
