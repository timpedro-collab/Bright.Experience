/**
 * PricingExplorer — the audience-aware core of the public pricing page.
 *
 * A persona selector (brand / agency / organizer / venue) and a region toggle
 * sit before any number, per docs/20 §3: brands and agencies see the tier
 * grid in their region's bands; organizers and venues never see public
 * numbers — they are routed to their partner pages, because they buy a
 * genuinely different product (wholesale terms / hosting economics).
 */
"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { TierCard } from "@/components/public/pricing/TierCard";
import { tiersForDisplay, type PriceRegion } from "@/lib/pricing/tiers";
import { PRICING_PERSONAS, type PricingPersona } from "@/lib/pricing/personas";

const REGIONS: ReadonlyArray<{ id: PriceRegion; label: string }> = [
  { id: "uk", label: "UK £" },
  { id: "us", label: "US $" },
  { id: "eu", label: "EU €" },
];

interface PricingExplorerProps {
  initialPersona?: PricingPersona;
}

export function PricingExplorer({ initialPersona = "brand" }: PricingExplorerProps) {
  const [persona, setPersona] = useState<PricingPersona>(initialPersona);
  const [region, setRegion] = useState<PriceRegion>("uk");

  const showsGrid = persona === "brand" || persona === "agency";
  const tiers = tiersForDisplay();

  return (
    <div>
      {/* Persona + region controls — always before any number. */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div
          role="group"
          aria-label="Who are you buying as?"
          className="flex flex-wrap gap-2"
        >
          {PRICING_PERSONAS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setPersona(p.id)}
              aria-pressed={persona === p.id}
              className={cn(
                "rounded-full border px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                persona === p.id
                  ? "border-[var(--color-bb-cobalt)] bg-[var(--color-bb-cobalt)] text-white"
                  : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground",
              )}
            >
              {p.label}
            </button>
          ))}
        </div>

        {showsGrid && (
          <div
            role="group"
            aria-label="Price region"
            className="flex w-fit rounded-full border border-border p-1"
          >
            {REGIONS.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => setRegion(r.id)}
                aria-pressed={region === r.id}
                className={cn(
                  "rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  region === r.id
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {r.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {showsGrid && (
        <>
          {persona === "agency" && (
            <div className="mt-6 rounded-[var(--radius-card)] border border-border/60 bg-muted/40 px-5 py-4 text-sm text-muted-foreground">
              <span className="font-medium text-foreground">Trade terms:</span>{" "}
              the bands below are rack. Recognised agencies and planners work
              on commissionable rates (10–15% by volume) —{" "}
              <a
                href="mailto:hello@brightblue.com"
                className="underline underline-offset-4 hover:text-foreground"
              >
                ask for the rate card
              </a>
              .
            </div>
          )}

          <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {tiers.map((tier) => (
              <TierCard key={tier.slug} tier={tier} region={region} />
            ))}
          </div>

          <p className="mt-6 text-xs text-muted-foreground">
            Bands are indicative for standard 1–3 day event activations and
            firm up in your proposal. Multi-week programs, premium-location
            takeovers and tours are quoted bespoke. Middle East and other
            regions: priced on application.
          </p>

          {persona === "brand" && (
            <div className="mt-10 rounded-2xl border border-border bg-muted/30 p-6 md:p-8">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                The arithmetic your CFO will do anyway
              </p>
              <p className="mt-3 max-w-3xl text-base leading-relaxed text-foreground/90">
                Capture 300 opted-in leads over a show and a Lead Engine
                activation works out at roughly{" "}
                <span className="font-semibold text-foreground">
                  £55–80 per lead
                </span>{" "}
                — against a $112 trade-show average (CEIR) and $75–200 on
                LinkedIn Lead Gen. And unlike a badge scan, every one of those
                leads chose to play, chose to opt in, and remembers you.
              </p>
              <Button variant="glass" size="sm" className="mt-5" asChild>
                <Link href="/business-case">
                  Build your business case
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          )}
        </>
      )}

      {persona === "organizer" && (
        <PartnerRoute
          heading="You don't pay rack — you set the price."
          body="Organizers work on wholesale terms: we deliver, run and report; you set your sponsor-facing price and keep the margin. Sponsors get a measured, branded activation on your floor — you get top-tier prospectus inventory without adding headcount."
          bullets={[
            "Wholesale pricing deck on request — your margin, your price to your sponsor",
            "Co-branded pitch links your sales team can send the same day",
            "We handle delivery, staffing, restocks and the proof-of-performance report",
          ]}
          ctaLabel="See how organizers sell with us"
          ctaHref="/for-organizers"
        />
      )}

      {persona === "venue" && (
        <PartnerRoute
          heading="Your venue doesn't buy anything — it earns."
          body="Venues host machines on hosting economics, not rental prices: revenue share or a guarantee with overage, built around your calendar. Dark days become income; your visitors get something worth queuing for."
          bullets={[
            "Revenue share or guarantee + overage — shaped to your footfall",
            "Zero operational lift: we deliver, run, restock and remove",
            "A live dashboard of what your placement is earning",
          ]}
          ctaLabel="See what your venue could earn"
          ctaHref="/for-venues"
        />
      )}
    </div>
  );
}

/** The no-numbers routing panel for partner personas. */
function PartnerRoute({
  heading,
  body,
  bullets,
  ctaLabel,
  ctaHref,
}: {
  heading: string;
  body: string;
  bullets: string[];
  ctaLabel: string;
  ctaHref: string;
}) {
  return (
    <div className="mt-8 rounded-2xl border border-border bg-muted/30 p-8 md:p-10">
      <h3 className="text-display-grotesk text-2xl text-foreground md:text-3xl">
        {heading}
      </h3>
      <p className="mt-3 max-w-3xl text-base leading-relaxed text-muted-foreground">
        {body}
      </p>
      <ul className="mt-5 space-y-2">
        {bullets.map((b) => (
          <li key={b} className="flex items-start gap-2 text-sm text-foreground/90">
            <span
              aria-hidden
              className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-bb-cobalt)]"
            />
            <span>{b}</span>
          </li>
        ))}
      </ul>
      <Button variant="brand" className="mt-6" asChild>
        <Link href={ctaHref}>
          {ctaLabel}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </Button>
    </div>
  );
}
