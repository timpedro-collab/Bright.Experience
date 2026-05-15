/**
 * ProposalAssetRequirements — the "what we'll need from you" section.
 *
 * Lives on the proposal brochure between outcomes and ROI. Two layers:
 * 1. The creative specs the customer needs to provide IF they have their own
 *    team. Each tile is tagged Static or Motion so the customer can read the
 *    Studio rate card alongside.
 * 2. The Bright.Studio rate card itself — a tier × medium matrix sourced from
 *    `src/lib/bright-studio.ts`. The customer reads outcome lines, sees per-
 *    asset prices, and picks per-asset which tier (or none) Studio should run.
 *
 * The customer is already on the proposal page seeing the total — revealing
 * Studio rates here does not violate the "defer price" principle.
 */
import { CheckCircle2, Sparkles } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ASSET_SPECS,
  STUDIO_TIERS,
  STUDIO_TURNAROUND,
  formatTierPrice,
} from "@/lib/bright-studio";

export function ProposalAssetRequirements() {
  return (
    <Card tone="subtle" className="print-break-inside-avoid">
      <CardHeader>
        <p className="text-overline text-muted-foreground">
          So we can prep your portal
        </p>
        <CardTitle className="text-2xl">What we'll need from you</CardTitle>
        <p className="mt-2 text-sm text-muted-foreground">
          Have a creative team in-house? Build to these specs and we'll plug
          them in. Don't? Bright.Studio designs portal activations every working
          day of the year — pick the tier that fits per asset, or hand the lot
          to us.
        </p>
      </CardHeader>
      <CardContent className="space-y-8">
        {/* Layer 1 — asset specs */}
        <ul className="grid gap-3 sm:grid-cols-2">
          {ASSET_SPECS.map((spec) => (
            <li
              key={spec.slug}
              className="rounded-[var(--radius-control)] border border-white/[0.06] bg-white/[0.02] p-4"
            >
              <div className="flex items-start gap-2">
                <CheckCircle2
                  className="mt-0.5 h-4 w-4 shrink-0 text-primary"
                  aria-hidden
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-foreground">
                      {spec.label}
                    </p>
                    <Badge
                      variant={spec.medium === "motion" ? "info" : "muted"}
                      className="text-[0.6875rem] font-normal"
                    >
                      {spec.medium === "motion" ? "Motion" : "Static"}
                    </Badge>
                  </div>
                  <p className="mt-1 font-mono text-xs leading-snug text-muted-foreground">
                    {spec.spec}
                  </p>
                  <p className="mt-1.5 text-xs leading-snug text-muted-foreground">
                    {spec.purpose}
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ul>

        {/* Layer 2 — Bright.Studio rate card */}
        <div className="rounded-[var(--radius-card)] border border-primary/20 bg-primary/[0.04] p-5 md:p-6">
          <div className="mb-5 flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(135deg,hsl(223,94%,53%),hsl(189,100%,75%))] text-white">
              <Sparkles className="h-4 w-4" aria-hidden />
            </div>
            <div>
              <p className="text-overline text-primary">Bright.Studio</p>
              <p className="text-base font-semibold text-foreground">
                We can do this for you.
              </p>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Three tiers, per asset. Pick the right one for each piece — or
                hand us the whole brief.
              </p>
            </div>
          </div>

          <ul className="grid gap-3 md:grid-cols-3">
            {STUDIO_TIERS.map((tier) => (
              <li
                key={tier.slug}
                className="flex flex-col rounded-[var(--radius-control)] border border-white/[0.06] bg-[hsl(233,56%,9%)] p-4"
              >
                <p className="text-sm font-semibold text-foreground">
                  {tier.label}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {tier.description}
                </p>

                <div className="my-4 grid grid-cols-2 gap-2 rounded-[var(--radius-control)] border border-white/[0.06] bg-white/[0.02] p-3 text-center">
                  <div>
                    <p className="text-overline text-muted-foreground">Static</p>
                    <p className="mt-0.5 text-lg font-bold tabular-nums text-primary">
                      {formatTierPrice(tier, "static")}
                    </p>
                    <p className="text-[0.6875rem] uppercase tracking-wider text-muted-foreground">
                      per asset
                    </p>
                  </div>
                  <div className="border-l border-white/[0.06] pl-2">
                    <p className="text-overline text-muted-foreground">Motion</p>
                    <p className="mt-0.5 text-lg font-bold tabular-nums text-primary">
                      {formatTierPrice(tier, "motion")}
                    </p>
                    <p className="text-[0.6875rem] uppercase tracking-wider text-muted-foreground">
                      per asset
                    </p>
                  </div>
                </div>

                <ul className="mt-auto space-y-1.5 text-xs text-muted-foreground">
                  {tier.inclusions.map((line) => (
                    <li key={line} className="flex items-start gap-1.5">
                      <CheckCircle2
                        className="mt-0.5 h-3 w-3 shrink-0 text-primary"
                        aria-hidden
                      />
                      <span>{line}</span>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>

          <p className="mt-5 text-xs text-muted-foreground">
            Motion pricing applies to video assets 10–30 seconds in length.
            Standard turnaround is{" "}
            <span className="text-foreground">
              {STUDIO_TURNAROUND.standardWorkingDays} working days
            </span>
            ; anything faster incurs a{" "}
            <span className="text-foreground">
              {STUDIO_TURNAROUND.expressUpliftPercent}% express fee
            </span>
            . Tell your account manager which tiers you want and they'll fold
            them into the line items above.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
