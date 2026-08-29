/**
 * OwnerBadge — the one prominent "whose move is it?" pill used everywhere
 * (timeline, checklist, ownership panel, deadlines, dashboards).
 *
 * One vocabulary, one visual language: when the work is the viewer's it
 * renders loud (filled cobalt + live dot — "Awaiting you"); otherwise it's a
 * quiet neutral pill ("Awaiting Operations"). This is intentionally the most
 * legible signal in any row, not a tiny afterthought.
 */
import { cn } from "@/lib/utils";
import { resolveOwnerBadge, type OwnerRole } from "@/lib/ownership";
import type { UserRole } from "@/types";

interface OwnerBadgeProps {
  owner: OwnerRole;
  viewerRole?: UserRole;
  isInternal?: boolean;
  /** `sm` for dense rows, `md` for headers/cards. */
  size?: "sm" | "md";
  className?: string;
}

export function OwnerBadge({
  owner,
  viewerRole,
  isInternal = false,
  size = "sm",
  className,
}: OwnerBadgeProps) {
  const { label, isYou } = resolveOwnerBadge(owner, viewerRole, isInternal);

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-semibold whitespace-nowrap",
        size === "sm" ? "px-2 py-0.5 text-[0.6rem]" : "px-2.5 py-1 text-xs",
        isYou
          ? "bg-primary text-primary-foreground shadow-sm"
          : "bg-muted text-muted-foreground",
        className,
      )}
    >
      {isYou && (
        <span
          aria-hidden
          className="relative flex h-1.5 w-1.5"
        >
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white/70" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-white" />
        </span>
      )}
      {label}
    </span>
  );
}
