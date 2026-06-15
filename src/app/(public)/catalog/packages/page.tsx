/** Packages index — pricing tier comparison grid */
import type { Metadata } from "next";
import Link from "next/link";

import { PackageTierCard } from "@/components/catalog/PackageTierCard";
import { CatalogFilters } from "@/components/catalog/CatalogFilters";
import { Container, Section } from "@/components/ui/section";
import { Button } from "@/components/ui/button";
import { RidgeArtwork, EditorialEyebrow } from "@/components/brand";
import { getPackages } from "@/lib/queries/packages";

export const metadata: Metadata = {
  title: "Packages & pricing",
  description:
    "Compare Bright.Blue activation packages — Standard, Premium, and Custom — with transparent base pricing for trade shows and events.",
};

const TIER_FILTERS = [
  { label: "All tiers", value: "" },
  { label: "Standard", value: "standard" },
  { label: "Premium", value: "premium" },
  { label: "Custom", value: "custom" },
];

export default async function PackagesIndexPage({
  searchParams,
}: {
  searchParams: Promise<{ tier?: string }>;
}) {
  const { tier } = await searchParams;
  const packages = await getPackages();
  const filtered =
    tier && ["standard", "premium", "custom"].includes(tier)
      ? packages.filter((p) => p.tier === tier)
      : packages;

  return (
    <>
      <section className="relative isolate overflow-hidden border-b border-border/40">
        <div
          aria-hidden
          className="absolute inset-x-0 top-0 ridge-color-cobalt"
          style={{ height: "clamp(240px, 28vw, 320px)" }}
        >
          <RidgeArtwork
            seed="catalog::packages"
            lines={22}
            amplitude={70}
            className="text-[hsl(230,93%,53%)]"
          />
          <div
            aria-hidden
            className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-background to-transparent"
          />
        </div>
        <Container className="relative pt-16 md:pt-20 pb-10">
          <EditorialEyebrow accent>Catalog</EditorialEyebrow>
          <h1 className="text-display mt-2 text-[clamp(2.25rem,4.5vw,3.75rem)] leading-[1.1] text-foreground">
            Packages &amp; pricing.
          </h1>
          <p className="mt-3 max-w-2xl text-base text-muted-foreground md:text-lg leading-relaxed">
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
      </section>

      <Section>
        <Container>
          <div className="mb-8">
            <CatalogFilters
              param="tier"
              options={TIER_FILTERS}
              label="Filter packages by tier"
            />
          </div>
          {filtered.length === 0 ? (
            <div className="rounded-[var(--radius-card)] border border-white/[0.06] bg-white/[0.02] p-12 text-center text-muted-foreground">
              {tier
                ? `No ${tier} packages are available right now. Try removing the filter, or request a tailored proposal.`
                : "Package pricing is being finalised. Please request a proposal for tailored pricing."}
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-3">
              {filtered.map((p, i) => (
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
            What&apos;s included
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
