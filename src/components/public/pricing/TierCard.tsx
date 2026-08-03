/**
 * TierCard — one commercial tier on the public pricing page.
 *
 * Bullets are derived from the canonical tier model, never hardcoded: the
 * base tier lists the always-on capabilities; each higher tier lists only its
 * delta over the previous tier ("Everything in X, plus…"), per docs/20 §2.
 */
import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ALWAYS_ON, getCapability } from "@/lib/capabilities";
import {
  TIERS,
  formatTierBand,
  type PriceRegion,
  type PricingTier,
} from "@/lib/pricing/tiers";

interface TierCardProps {
  tier: PricingTier;
  region: PriceRegion;
}

/** The ladder: base tier shows the always-on set, higher tiers show only their delta. */
function tierBullets(tier: PricingTier): { lead: string | null; items: string[] } {
  const idx = TIERS.findIndex((t) => t.slug === tier.slug);
  if (idx <= 0) {
    return {
      lead: null,
      items: [...ALWAYS_ON.map((c) => c.outcome), tier.reporting],
    };
  }
  const prev = TIERS[idx - 1];
  const newCapabilities = tier.includedCapabilitySlugs
    .filter((slug) => !prev.includedCapabilitySlugs.includes(slug))
    .map((slug) => getCapability(slug)?.outcome ?? slug);
  const newServices = tier.serviceFeatures.filter(
    (feature) => !prev.serviceFeatures.includes(feature),
  );
  const items = [...newCapabilities, ...newServices];
  if (tier.reporting !== prev.reporting) items.push(tier.reporting);
  return { lead: `Everything in ${prev.displayName}, plus:`, items };
}

export function TierCard({ tier, region }: TierCardProps) {
  const featured = tier.badge === "most-popular";
  const bespoke = tier.slug === "bespoke";
  const bullets = tierBullets(tier);

  return (
    <div
      className={cn(
        "relative flex h-full flex-col rounded-2xl border p-6",
        featured
          ? "border-[var(--color-bb-cobalt)]/50 bg-[var(--color-bb-cobalt)]/[0.04] ring-1 ring-[var(--color-bb-cobalt)]/30"
          : "border-border bg-muted/30",
        bespoke && "border-dashed",
      )}
    >
      {featured && (
        <span className="absolute -top-3 left-6 rounded-full bg-[var(--color-bb-cobalt)] px-3 py-0.5 text-xs font-semibold text-white">
          Most popular
        </span>
      )}

      <h3 className="text-lg font-semibold text-foreground">{tier.displayName}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{tier.strapline}</p>

      <p className="mt-5 text-2xl font-semibold tracking-tight text-foreground">
        {formatTierBand(tier, region)}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">
        {bespoke
          ? "Tours · custom game builds · residencies"
          : "1–3 day event activation"}
      </p>

      <ul className="mt-6 flex-1 space-y-2.5">
        {bullets.lead && (
          <li className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {bullets.lead}
          </li>
        )}
        {bullets.items.map((item) => (
          <li key={item} className="flex items-start gap-2 text-sm text-foreground/90">
            <Check
              className="mt-0.5 h-4 w-4 shrink-0 text-[hsl(189,100%,75%)]"
              aria-hidden
            />
            <span>{item}</span>
          </li>
        ))}
      </ul>

      <Button
        variant={featured ? "brand" : "glass"}
        className="mt-6 w-full"
        asChild
      >
        <Link href="/proposal">
          {bespoke ? "Start a bespoke conversation" : "Get a proposal"}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </Button>
    </div>
  );
}
