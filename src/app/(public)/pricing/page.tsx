/**
 * Public pricing page — the three-tier + bespoke model from docs/20, shown
 * audience-aware: persona + region selection before any number. Deep-linkable
 * via `?for=organizer|venue|agency|brand`.
 */
import type { Metadata } from "next";

import { Container, Section } from "@/components/ui/section";
import { PricingExplorer } from "@/components/public/pricing/PricingExplorer";
import { FleetAvailability } from "@/components/public/pricing/FleetAvailability";
import { isPricingPersona } from "@/lib/pricing/personas";
import { upcomingMonths } from "@/lib/pricing/fleet-availability";
import { getFleetMonthAvailability } from "@/lib/queries/fleet-availability";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "What a Bright.Blue activation costs — three tiers with real bands for UK, US and EU events, plus bespoke programs. No mystery, no 'call for pricing'.",
};

interface PageProps {
  searchParams: Promise<{ for?: string }>;
}

export default async function PricingPage({ searchParams }: PageProps) {
  const { for: personaParam } = await searchParams;
  const initialPersona = isPricingPersona(personaParam) ? personaParam : "brand";

  // Real scarcity only: derived from the booking calendar for the next
  // three months; the module simply doesn't render if the read fails.
  const availability = await getFleetMonthAvailability(upcomingMonths(3));

  return (
    <>
      <Section spacing="md" className="border-b border-border/60">
        <Container>
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground mb-3">
              Pricing
            </p>
            <h1 className="text-display-grotesk text-4xl text-foreground md:text-6xl">
              What an activation costs.
            </h1>
            <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
              Real bands, published — because you shouldn&apos;t need a
              discovery call to know if we fit your budget. Pick who you are;
              the numbers adjust to how you actually buy.
            </p>
          </div>
        </Container>
      </Section>

      <Section>
        <Container>
          <PricingExplorer initialPersona={initialPersona} />
          <div className="mt-12">
            <FleetAvailability months={availability} />
          </div>
        </Container>
      </Section>
    </>
  );
}
