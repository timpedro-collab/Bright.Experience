/**
 * EditionPlate — a compact card representing a single event.
 *
 * Used everywhere multiple events need to be shown at a glance:
 *   - The internal Work Hub (grid of all events)
 *   - "Your other events" rail on Customer Home (for multi-event clients)
 *   - The reseller / partner dashboard
 *
 * Anatomy:
 *   ┌──────────────────────────┐
 *   │                          │
 *   │     mini ridge artwork   │     unique generative signature
 *   │                          │     scoped to this event id
 *   ├──────────────────────────┤
 *   │ Acme · Spring            │     display title (Nunito)
 *   │ WESTFIELD LONDON         │     overline meta
 *   │ ● IN PRODUCTION          │     status pill
 *   └──────────────────────────┘
 *
 * The plate is keyboard-accessible and acts as a link when `href` is set.
 */
import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { RidgeArtwork } from "./ridge-artwork";
import { EditorialEyebrow } from "./editorial";
import { EventProgressRing } from "@/components/dashboard/EventProgressRing";

export type PlateStatusTone = "active" | "live" | "client" | "wrap" | "warning";

interface EditionPlateProps {
  /** Stable id used for the ridge seed and React key. */
  id: string;
  /** Display title (e.g. "Acme · Spring"). */
  title: string;
  /** Secondary location / metadata line (rendered as overline). */
  meta?: string;
  /** Status pill label (e.g. "In production", "Live"). */
  statusLabel?: string;
  statusTone?: PlateStatusTone;
  /** Show a small "Waiting on you" badge in the corner. */
  waitingOnYou?: boolean;
  /** If set, the plate links to this href. */
  href?: string;
  /** Task completion counts for the progress ring. */
  completedTasks?: number;
  totalTasks?: number;
  className?: string;
}

const TONE_DOT: Record<PlateStatusTone, string> = {
  active: "bg-[var(--color-bb-cobalt)]",
  live: "bg-[var(--color-bb-cyan)] shadow-[0_0_0_3px_hsl(189_100%_75%_/_0.18)]",
  client: "bg-[var(--color-bb-cyan)]",
  wrap: "bg-muted-foreground/60",
  warning: "bg-[hsl(43_90%_56%)]",
};

const TONE_TEXT: Record<PlateStatusTone, string> = {
  active: "text-[var(--color-bb-cobalt)]",
  live: "text-[var(--color-bb-cyan)]",
  client: "text-[var(--color-bb-cyan)]",
  wrap: "text-muted-foreground",
  warning: "text-[hsl(43_90%_68%)]",
};

export function EditionPlate({
  id,
  title,
  meta,
  statusLabel,
  statusTone = "active",
  waitingOnYou,
  href,
  completedTasks,
  totalTasks,
  className,
}: EditionPlateProps) {
  const hasProgress =
    typeof completedTasks === "number" && typeof totalTasks === "number" && totalTasks > 0;
  const body = (
    <article
      className={cn(
        "relative flex flex-col gap-0 rounded-lg overflow-hidden",
        "border border-border/80 bg-card",
        "transition-[border-color,transform,box-shadow] duration-200",
        "hover:border-[var(--color-bb-cobalt)]/60 hover:-translate-y-0.5 hover:shadow-[var(--bb-shadow-card)]",
        "focus-within:border-[var(--color-bb-cobalt)] focus-within:shadow-[var(--bb-shadow-glow)]",
        className,
      )}
    >
      <div className="relative h-32 overflow-hidden">
        <RidgeArtwork
          seed={id}
          lines={14}
          amplitude={40}
          strokeWidth={0.9}
          className="text-[hsl(230,93%,53%)] ridge-veil"
        />
        <div
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-card to-transparent"
        />
        {waitingOnYou && (
          <span className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-background/85 px-2 py-1 text-overline text-[var(--color-bb-cobalt)] backdrop-blur-sm border border-[var(--color-bb-cobalt)]/30">
            <span className="size-1.5 rounded-full bg-[var(--color-bb-cobalt)]" />
            Waiting on you
          </span>
        )}
      </div>
      <div className="flex flex-col gap-1.5 px-5 py-4">
        <h3 className="text-heading text-xl font-bold text-foreground leading-tight">
          {title}
        </h3>
        {meta && (
          <EditorialEyebrow className="opacity-75">{meta}</EditorialEyebrow>
        )}
        {(statusLabel || hasProgress) && (
          <div className="mt-2 flex items-center justify-between gap-2">
            {statusLabel && (
              <div className="flex items-center gap-2">
                <span
                  className={cn("size-1.5 rounded-full", TONE_DOT[statusTone])}
                  aria-hidden
                />
                <EditorialEyebrow className={TONE_TEXT[statusTone]}>
                  {statusLabel}
                </EditorialEyebrow>
              </div>
            )}
            {hasProgress && (
              <EventProgressRing
                completed={completedTasks!}
                total={totalTasks!}
                size={36}
                strokeWidth={3}
              />
            )}
          </div>
        )}
      </div>
    </article>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-bb-cobalt)] focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-lg"
      >
        {body}
      </Link>
    );
  }
  return body;
}
