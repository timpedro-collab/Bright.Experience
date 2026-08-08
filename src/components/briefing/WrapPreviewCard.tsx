/**
 * Instant wrap preview — the customer's brand colour and logo composited
 * onto the machine render while they brief, so the sale and the brief both
 * see the finished thing early. The versioned approval flow is unchanged:
 * this is an impression, print-ready art still goes through creative review.
 */
"use client";

import { useState } from "react";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import { parseColors } from "@/components/briefing/BrandColorsField";
import { machineRenderFor } from "@/lib/machine-renders";

const HEX6 = /^#?[0-9a-f]{6}$/i;
const HEX3 = /^#?[0-9a-f]{3}$/i;

/** First usable hex from the comma-separated colour brief, or null. */
export function firstBrandHex(colorPreferences: string): string | null {
  for (const token of parseColors(colorPreferences)) {
    const t = token.trim();
    if (HEX6.test(t)) return t.startsWith("#") ? t : `#${t}`;
    if (HEX3.test(t)) {
      const h = t.replace("#", "");
      return `#${h[0]}${h[0]}${h[1]}${h[1]}${h[2]}${h[2]}`;
    }
  }
  return null;
}

interface WrapPreviewCardProps {
  machineType?: string | null;
  /** The saved `color_preferences` brief value ("#E61A27, #111111"). */
  colorPreferences: string;
  /** Signed URL of an uploaded logo image, when one exists. */
  logoUrl?: string | null;
}

export function WrapPreviewCard({
  machineType,
  colorPreferences,
  logoUrl,
}: WrapPreviewCardProps) {
  const briefHex = firstBrandHex(colorPreferences);
  const [color, setColor] = useState(briefHex ?? "#246BFD");
  const render = machineRenderFor(machineType);

  return (
    <Card tone="subtle" className="p-5">
      <p className="text-overline text-muted-foreground">Instant wrap preview</p>
      <div className="relative mt-3 aspect-[3/4] overflow-hidden rounded-[var(--radius-control)]">
        {/* Wrap colour floods the panel behind the render. */}
        <div
          className="absolute inset-0"
          style={{ backgroundColor: color }}
          data-testid="wrap-colour-panel"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/25 to-transparent" />
        <Image
          src={render}
          alt="Machine render with your wrap colour"
          fill
          sizes="18rem"
          className="object-contain mix-blend-multiply p-3"
        />
        {logoUrl && (
          // Signed storage URL, unknown dimensions — a plain img keeps this
          // outside Next image optimisation, which can't fetch signed URLs.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={logoUrl}
            alt="Your logo on the wrap"
            className="absolute left-1/2 top-[18%] w-1/3 -translate-x-1/2 rounded bg-white/85 p-1.5 object-contain"
          />
        )}
      </div>
      <div className="mt-3 flex items-center gap-2">
        <input
          type="color"
          aria-label="Wrap colour"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          className="h-8 w-10 cursor-pointer rounded border border-border bg-transparent"
        />
        <p className="text-xs text-muted-foreground">
          {briefHex
            ? "Seeded from your brand colours — try variations."
            : "Add brand colours to your brief to seed this automatically."}
        </p>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        An impression, not the artwork — print-ready wrap art still goes
        through creative approval.
      </p>
    </Card>
  );
}
