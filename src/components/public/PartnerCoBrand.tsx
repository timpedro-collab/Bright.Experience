/**
 * PartnerCoBrand — co-branded partner lockup for the public funnel.
 *
 * Renders the partner's logo (or a monogram fallback) paired with the
 * Bright.Blue mark in an "X" lockup, tinted with the partner's accent colour.
 * Used on the `/p/[code]` hero and inside the persistent attribution banner so
 * a reseller's brand travels with the customer through the funnel.
 *
 * Real logo assets are a deferred handoff item; until then the monogram keeps
 * the lockup looking intentional rather than broken.
 */
import Image from "next/image";

interface PartnerCoBrandProps {
  name: string;
  logoUrl?: string | null;
  /** Partner accent colour (any CSS color). Falls back to brand cobalt. */
  accent?: string | null;
  /** "lockup" pairs partner × Bright.Blue; "mark" shows the partner alone. */
  variant?: "lockup" | "mark";
  size?: "sm" | "md";
  className?: string;
}

function monogram(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

export function PartnerCoBrand({
  name,
  logoUrl,
  accent,
  variant = "lockup",
  size = "md",
  className,
}: PartnerCoBrandProps) {
  const ringColor = accent || "hsl(230 93% 53%)";
  const dim = size === "sm" ? "h-8 w-8 text-xs" : "h-11 w-11 text-sm";
  const logoH = size === "sm" ? 32 : 44;

  const partnerMark = logoUrl ? (
    <Image
      src={logoUrl}
      alt={name}
      width={logoH * 3}
      height={logoH}
      className="w-auto object-contain"
      style={{ height: logoH }}
    />
  ) : (
    <span
      aria-label={name}
      className={`inline-flex ${dim} shrink-0 items-center justify-center rounded-full font-[var(--font-heading)] font-bold tracking-tight`}
      style={{
        border: `1.5px solid ${ringColor}`,
        color: ringColor,
        backgroundColor: "color-mix(in srgb, var(--background) 88%, transparent)",
      }}
    >
      {monogram(name) || "P"}
    </span>
  );

  if (variant === "mark") {
    return (
      <span className={`inline-flex items-center gap-2 ${className ?? ""}`}>
        {partnerMark}
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-3 ${className ?? ""}`}>
      {partnerMark}
      <span
        className="text-overline"
        style={{ color: ringColor }}
        aria-hidden
      >
        ×
      </span>
      <span className="font-[var(--font-heading)] text-base font-bold tracking-tight text-foreground">
        bright<span className="text-primary">.blue</span>
      </span>
    </span>
  );
}
