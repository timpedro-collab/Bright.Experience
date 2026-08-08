/**
 * DeliveryFeed — the behind-the-scenes timeline plus time-gated reveals for
 * the pre-event delivery window. Renders nothing outside that window, so it
 * can sit permanently in CustomerEventBody.
 */
import Image from "next/image";
import { Check, Lock, Truck } from "lucide-react";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  buildDeliveryFeed,
  buildStagedReveals,
} from "@/lib/delivery-feed";
import { machineRenderFor } from "@/lib/machine-renders";
import type { Event } from "@/types";

export function DeliveryFeed({ event }: { event: Event }) {
  const feed = buildDeliveryFeed({
    stage: event.currentStage,
    eventDateStart: event.eventDateStart,
    venueName: event.venueName,
  });
  if (!feed) return null;

  const reveals = buildStagedReveals({
    eventDateStart: event.eventDateStart,
    venueName: event.venueName,
  });

  return (
    <Card tone="subtle" className="p-5">
      <div className="flex items-center gap-2">
        <Truck className="size-4 text-[var(--color-bb-cobalt)]" aria-hidden />
        <p className="text-sm font-semibold text-foreground">
          Behind the scenes right now
        </p>
      </div>

      <ol className="mt-4 space-y-2.5">
        {feed.map((item) => (
          <li key={item.label} className="flex items-start gap-3">
            <span
              className={cn(
                "mt-0.5 inline-flex size-4.5 shrink-0 items-center justify-center rounded-full",
                item.state === "done" && "bg-success/15 text-success",
                item.state === "active" &&
                  "bg-[var(--color-bb-cobalt)]/15 text-[var(--color-bb-cobalt)]",
                item.state === "upcoming" && "border border-border text-transparent",
              )}
            >
              {item.state === "done" ? (
                <Check className="size-3" aria-hidden />
              ) : item.state === "active" ? (
                <span className="size-1.5 animate-pulse rounded-full bg-current" />
              ) : null}
            </span>
            <span className="min-w-0 text-sm">
              <span
                className={cn(
                  "font-medium",
                  item.state === "upcoming"
                    ? "text-muted-foreground"
                    : "text-foreground",
                )}
              >
                {item.label}
              </span>
              {item.state !== "upcoming" && (
                <span className="block text-xs text-muted-foreground">
                  {item.detail}
                </span>
              )}
            </span>
          </li>
        ))}
      </ol>

      {reveals && (
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          {reveals.map((reveal) => (
            <div
              key={reveal.key}
              className={cn(
                "relative overflow-hidden rounded-[var(--radius-control)] border p-3.5",
                reveal.unlocked
                  ? "border-[var(--color-bb-cobalt)]/30 bg-[var(--color-bb-cobalt)]/[0.04]"
                  : "border-dashed border-border",
              )}
            >
              {reveal.unlocked && reveal.key === "wrap" && (
                <div className="relative mb-2.5 h-24 overflow-hidden rounded bg-muted/40">
                  <Image
                    src={machineRenderFor(event.machineType)}
                    alt="Your machine render"
                    fill
                    sizes="12rem"
                    className="object-contain p-1.5"
                  />
                </div>
              )}
              <p
                className={cn(
                  "text-xs font-semibold",
                  reveal.unlocked ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {reveal.title}
              </p>
              {reveal.unlocked ? (
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  {reveal.body}
                </p>
              ) : (
                <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                  <Lock className="size-3" aria-hidden />
                  {reveal.unlocksLabel}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
