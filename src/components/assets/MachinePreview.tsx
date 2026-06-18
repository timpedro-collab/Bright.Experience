/**
 * MachinePreview — composites an uploaded creative onto a machine render and
 * zooms into the placement, mirroring the Cloud Media Library preview.
 *
 * Technique (ported from Theo's `ProductsAltPage` preview):
 *  - A square frame; all rects are measured as % of the square render so they
 *    stay anchored to the artwork.
 *  - A zoom wrapper is scaled up and panned so the placement's `viewport`
 *    rect fills the frame. It animates from the full machine to the
 *    placement on mount, giving the same "glide-in" feel.
 *  - The creative is painted as an absolutely-positioned image at its exact
 *    `overlay` rect, inside the same zoom wrapper, so it scales/pans with the
 *    base render.
 */
"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import {
  FULL_VIEWPORT,
  type PlacementPreview,
  type Rect,
} from "@/lib/asset-requirements/placements";
import type { PlacementSlotDefinition } from "@/lib/asset-requirements/slot-registry";
import { PlacementPlaceholder } from "@/components/assets/PlacementPlaceholder";

const EASE = "cubic-bezier(0.4, 0, 0.2, 1)";

export function MachinePreview({
  preview,
  overlaySrc,
  overlayKind = "image",
  slot,
  showPlaceholder = true,
  className,
  debug = false,
}: {
  preview: PlacementPreview;
  /** Image/video URL to composite (blob URL while staging, or a signed URL). */
  overlaySrc?: string | null;
  /** Whether the creative is a still or a video (autoplays muted/looping). */
  overlayKind?: "image" | "video";
  /**
   * Slot definition driving the labeled placeholder when no creative is
   * present. This is the seam Theo extends: once real art/preview lands the
   * placeholder simply stops rendering (or `showPlaceholder` is turned off).
   */
  slot?: PlacementSlotDefinition;
  /** Render the labeled placeholder when `overlaySrc` is absent. Defaults to true. */
  showPlaceholder?: boolean;
  className?: string;
  /** Draw an outline on the overlay rect (calibration aid). */
  debug?: boolean;
}) {
  const { screenImage, overlay, viewport, fit = "cover", caption } = preview;
  const overlayRectStyle: React.CSSProperties = {
    left: `${overlay.x}%`,
    top: `${overlay.y}%`,
    width: `${overlay.w}%`,
    height: `${overlay.h}%`,
    objectFit: fit,
  };

  // Park on the full machine, then glide to the placement's viewport.
  const [vp, setVp] = React.useState<Rect>(FULL_VIEWPORT);
  React.useEffect(() => {
    const id = requestAnimationFrame(() => setVp(viewport));
    return () => cancelAnimationFrame(id);
  }, [viewport]);

  const scale = 100 / Math.max(vp.w, vp.h);
  const imgLeft = -vp.x * scale;
  const imgTop = -vp.y * scale;
  const imgSize = 100 * scale;

  const motion = ["left", "top", "width", "height"]
    .map((p) => `${p} 900ms ${EASE}`)
    .join(", ");

  return (
    <figure className={cn("min-w-0", className)}>
      <div className="relative aspect-square w-full overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-muted/40 to-background shadow-sm">
        <div
          className="absolute"
          style={{
            left: `${imgLeft}%`,
            top: `${imgTop}%`,
            width: `${imgSize}%`,
            height: `${imgSize}%`,
            transition: motion,
            willChange: "left, top, width, height",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={screenImage}
            alt=""
            className="absolute inset-0 h-full w-full select-none"
            draggable={false}
          />
          {overlaySrc ? (
            overlayKind === "video" ? (
              <video
                src={overlaySrc}
                className="pointer-events-none absolute select-none"
                style={overlayRectStyle}
                autoPlay
                loop
                muted
                playsInline
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={overlaySrc}
                alt=""
                className="pointer-events-none absolute select-none"
                draggable={false}
                style={overlayRectStyle}
              />
            )
          ) : showPlaceholder && slot ? (
            <PlacementPlaceholder
              slot={slot}
              style={{
                left: `${overlay.x}%`,
                top: `${overlay.y}%`,
                width: `${overlay.w}%`,
                height: `${overlay.h}%`,
              }}
            />
          ) : null}
          {debug ? (
            <div
              aria-hidden
              className="pointer-events-none absolute border-2 border-pink-500"
              style={{
                left: `${overlay.x}%`,
                top: `${overlay.y}%`,
                width: `${overlay.w}%`,
                height: `${overlay.h}%`,
              }}
            />
          ) : null}
        </div>
      </div>
      <figcaption className="mt-2 text-center text-overline text-muted-foreground">
        {caption}
      </figcaption>
    </figure>
  );
}
