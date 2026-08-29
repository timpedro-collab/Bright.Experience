/**
 * Editorial primitives — small, sharp building blocks that show up on
 * every Bright.Experience surface. Keeping them in one file because they
 * share a single editorial vocabulary (eyebrows + hairlines) and are
 * always imported together.
 *
 *   <EditorialEyebrow>   — tracked uppercase DM Sans Medium label
 *   <Hairline>           — gradient 1px rule used between editorial sections
 */
import * as React from "react";
import { cn } from "@/lib/utils";

// ─── Eyebrow ──────────────────────────────────────────────────────────────

interface EditorialEyebrowProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Render in the Ink accent cyan instead of muted foreground. */
  accent?: boolean;
}

export function EditorialEyebrow({
  className,
  accent = false,
  children,
  ...props
}: EditorialEyebrowProps) {
  return (
    <span
      className={cn(
        "text-overline",
        accent ? "text-brand-cyan" : "text-muted-foreground",
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}

// ─── Hairline ─────────────────────────────────────────────────────────────

interface HairlineProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: "horizontal" | "vertical";
}

export function Hairline({
  orientation = "horizontal",
  className,
  ...props
}: HairlineProps) {
  return (
    <div
      role="presentation"
      aria-hidden
      className={cn(
        orientation === "horizontal" ? "hairline" : "hairline-vertical",
        className,
      )}
      {...props}
    />
  );
}
