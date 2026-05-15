/** Packages index — pricing tier comparison grid */
import type { Metadata } from "next";
import Link from "next/link";

import { PackageTierCard } from "@/components/catalog/PackageTierCard";
import { Container, Section } from "@/components/ui/section";
import { Button } from "@/components/ui/button";
import { getPackages } from "@/lib/queries/packages";

export const metadata: Metadata = {
  title: "Packages & pricing",
  description:
    "Compare Bright.Blue activation packages — Standard, Premium, and Custom — with transparent base pricing for trade shows and events.",
};

export default async function PackagesIndexPage() {
  const packages = await getPackages();

  // Group by tier
  const tiered = {
    standard: packages.filter((p) => p.tier === "standard"),
    premium: packages.filter((p) => p.tier === "premium"),
    custom: packages.filter((p) => p.tier === "custom"),
  };

  return (
    <>
      <Section spacing="md" className="border-b border-white/[0.06]">
        <Container>
          <p className="text-overline text-muted-foreground">Catalog</p>
          <h1 className="text-display mt-2 text-4xl md:text-5xl font-bold text-foreground">
            Packages &amp; pricing
          </h1>
          <p className="mt-3 max-w-2xl text-base text-muted-foreground md:text-lg">
            Transparent pricing for trade shows and conferences. Experiential
            activations are quoted bespoke because location, footfall, and
            media value materially change the value of your spend.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            <Button asChild variant="brand">
              <Link href="/book">Book a standard package</Link>
            </Button>
            <Button asChild variant="glass">
              <Link href="/proposal">Request a custom proposal</Link>
            </Button>
          </div>
        </Container>
      </Section>

      <Section>
        <Container>
          {packages.length === 0 ? (
            <div className="rounded-[var(--radius-card)] border border-white/[0.06] bg-white/[0.02] p-12 text-center text-muted-foreground">
              Package pricing is being finalised. Please request a proposal for tailored pricing.
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-3">
              {[...tiered.standard, ...tiered.premium, ...tiered.custom].map((p, i) => (
                <PackageTierCard
                  key={p.id}
                  pkg={{
                    name: p.name,
                    slug: p.slug,
                    tier: p.tier,
                    basePrice: p.base_price,
                    featuresJson: (p.features_json as string[]) ?? [],
                    isBookable: p.is_bookable,
                  }}
                  featured={i === 1}
                />
              ))}
            </div>
          )}
        </Container>
      </Section>

      <Section className="border-t border-white/[0.06]" spacing="md">
        <Container size="sm">
          <h2 className="text-heading text-center text-2xl font-semibold md:text-3xl">
            What's included
          </h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-2">
            <Inclusion title="Hardware & installation" body="Delivery, install, on-site QA and collection across the UK." />
            <Inclusion title="Branded creative" body="Game graphics tuned to your brand, with optional Studio support." />
            <Inclusion title="Live telemetry" body="Real-time interactions, leads, and prize delivery you can see in your dashboard." />
            <Inclusion title="Proof of performance" body="Post-event report with hourly breakdowns, lead exports, and ROI benchmarks." />
          </div>
        </Container>
      </Section>
    </>
  );
}

function Inclusion({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-[var(--radius-card)] border border-white/[0.06] bg-white/[0.02] p-5">
      <h3 className="text-heading text-base font-semibold text-foreground">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{body}</p>
    </div>
  );
}
