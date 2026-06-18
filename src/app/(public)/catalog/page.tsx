/** Public catalog storefront — hero, logos, machines, case studies, trust band, CTA */
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Container, Section } from "@/components/ui/section";
import { CatalogHero } from "@/components/catalog/CatalogHero";
import { LogosStrip } from "@/components/catalog/LogosStrip";
import { TrustBand } from "@/components/catalog/TrustBand";
import { MachineCard } from "@/components/catalog/MachineCard";
import { CaseStudyCard } from "@/components/catalog/CaseStudyCard";

import { getMachines } from "@/lib/queries/machines";
import { getCaseStudies } from "@/lib/queries/case-studies";

export const metadata: Metadata = {
  title: "Catalog",
  description:
    "Explore Bright.Blue's experiential activation machines, games, and case studies. Find the perfect fit for your next event.",
  openGraph: {
    title: "Bright.Experience — Activations Catalog",
    description:
      "Interactive activation machines, games, and packages. Magazine-grade catalog with case studies and ROI insights.",
  },
};

export default async function CatalogPage() {
  const [machines, caseStudies] = await Promise.all([
    getMachines(),
    getCaseStudies(),
  ]);

  return (
    <>
      <CatalogHero />

      <LogosStrip />

      {/* Machines */}
      <Section id="machines">
        <Container>
          <SectionHeader
            eyebrow="The hardware"
            title="Our machines"
            description="Every Bright.Blue machine is engineered for crowd-stopping experiential moments — prize-rich, brandable, and built around our telemetry stack."
            href="/catalog/machines"
          />
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {machines.slice(0, 6).map((m, i) => (
              <MachineCard
                key={m.slug}
                machine={{
                  name: m.name,
                  slug: m.slug,
                  tagline: m.tagline ?? undefined,
                  heroImageUrl: m.hero_image_url,
                }}
                index={i}
              />
            ))}
          </div>
        </Container>
      </Section>

      {/* Case Studies */}
      {caseStudies.length > 0 && (
        <Section className="border-t border-border/60">
          <Container>
            <SectionHeader
              eyebrow="The proof"
              title="Recent case studies"
              description="Real-world activations with measurable outcomes."
              href="/catalog/case-studies"
            />
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {caseStudies.slice(0, 3).map((cs, i) => (
                <CaseStudyCard
                  key={cs.slug}
                  caseStudy={{
                    title: cs.title,
                    slug: cs.slug,
                    clientName: cs.client_name ?? undefined,
                    location: cs.location ?? undefined,
                    heroImageUrl: cs.hero_image_url ?? undefined,
                    statsJson: (cs.stats_json as Record<string, unknown>) ?? undefined,
                  }}
                  index={i}
                />
              ))}
            </div>
          </Container>
        </Section>
      )}

      <TrustBand />

      {/* Bottom CTA */}
      <Section className="border-t border-border/60">
        <Container size="md">
          <div className="text-center">
            <h2 className="text-heading text-3xl font-bold text-foreground md:text-4xl">
              Ready to stand out?
            </h2>
            <p className="mt-3 text-muted-foreground">
              Two minutes to find the activation that fits your event.
            </p>
            <div className="mt-8 flex justify-center">
              <Button size="lg" variant="brand" asChild>
                <Link href="/quiz">
                  Find your fit
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}

function SectionHeader({
  eyebrow,
  title,
  description,
  href,
  ctaLabel = "View all",
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  href: string;
  ctaLabel?: string;
}) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div className="max-w-2xl">
        {eyebrow && (
          <p className="text-overline text-muted-foreground mb-2">{eyebrow}</p>
        )}
        <h2 className="text-heading text-3xl font-bold text-foreground md:text-4xl">
          {title}
        </h2>
        {description && (
          <p className="mt-2 text-muted-foreground">{description}</p>
        )}
      </div>
      <Button variant="glass" size="sm" asChild>
        <Link href={href} className="shrink-0">
          {ctaLabel} <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </Button>
    </div>
  );
}
