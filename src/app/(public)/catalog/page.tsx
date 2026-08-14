/**
 * Catalog index — a compact browse page one click in from the homepage.
 * The marketing story (hero, trust band, testimonials) lives on `/`; this
 * page just lets a visitor scan the range: machines, games, packages,
 * case studies.
 */
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Gamepad2, Package as PackageIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Container, Section } from "@/components/ui/section";
import { MachineCard } from "@/components/catalog/MachineCard";
import { CaseStudyCard } from "@/components/catalog/CaseStudyCard";

import { getMachines } from "@/lib/queries/machines";
import { getCaseStudies } from "@/lib/queries/case-studies";

export const metadata: Metadata = {
  title: "Catalogue",
  description:
    "Explore Bright.Blue's experiential activation machines, games, and case studies. Find the perfect fit for your next event.",
  openGraph: {
    title: "Bright.Experience — Activations Catalogue",
    description:
      "Interactive activation machines, games, and packages. Magazine-grade catalogue with case studies and ROI insights.",
  },
};

export default async function CatalogPage() {
  const [machines, caseStudies] = await Promise.all([
    getMachines(),
    getCaseStudies(),
  ]);

  return (
    <>
      {/* Compact index header */}
      <Section spacing="md">
        <Container>
          <div className="max-w-2xl">
            <p className="text-overline text-muted-foreground mb-2">The catalogue</p>
            <h1 className="text-heading text-4xl font-bold text-foreground md:text-5xl">
              Browse the range
            </h1>
            <p className="mt-3 text-muted-foreground">
              Machines, games, and packages — every unit brandable, prize-rich,
              and instrumented for proof. Not sure where to start?{" "}
              <Link
                href="/quiz"
                className="font-medium text-[var(--color-bb-cobalt)] underline decoration-from-font underline-offset-4"
              >
                Take the 60-second quiz
              </Link>
              .
            </p>
          </div>
        </Container>
      </Section>

      {/* Machines */}
      <Section id="machines" spacing="md" className="border-t border-border/60">
        <Container>
          <SectionHeader
            eyebrow="The hardware"
            title="Our machines"
            description="Every Bright.Blue machine is engineered for crowd-stopping experiential moments."
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

      {/* Games + packages quick links */}
      <Section spacing="md" className="border-t border-border/60">
        <Container>
          <div className="grid gap-6 md:grid-cols-2">
            <IndexLinkCard
              icon={Gamepad2}
              title="Games"
              description="Reflex games, quizzes, prize mechanics — the software side of the draw."
              href="/catalog/games"
              cta="Browse games"
            />
            <IndexLinkCard
              icon={PackageIcon}
              title="Packages"
              description="Bundled machine + game + delivery tiers, ready to configure and book."
              href="/catalog/packages"
              cta="Compare packages"
            />
          </div>
        </Container>
      </Section>

      {/* Case Studies */}
      {caseStudies.length > 0 && (
        <Section spacing="md" className="border-t border-border/60">
          <Container>
            <SectionHeader
              eyebrow="In the field"
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

      {/* Slim bottom CTA */}
      <Section spacing="md" className="border-t border-border/60">
        <Container size="md">
          <div className="text-center">
            <h2 className="text-heading text-2xl font-bold text-foreground md:text-3xl">
              Not sure which fits?
            </h2>
            <p className="mt-2 text-muted-foreground">
              60 seconds to a machine and a reach estimate for your event.
            </p>
            <div className="mt-6 flex justify-center">
              <Button size="lg" variant="brand" asChild>
                <Link href="/quiz">
                  Find your match
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

function IndexLinkCard({
  icon: Icon,
  title,
  description,
  href,
  cta,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  href: string;
  cta: string;
}) {
  return (
    <Link
      href={href}
      className="group flex items-start gap-5 rounded-[var(--radius-card)] border border-white/[0.06] bg-[hsl(233,56%,11%,0.45)] p-7 backdrop-blur-md transition-all hover:border-white/20 hover:-translate-y-0.5"
    >
      <div className="flex size-12 shrink-0 items-center justify-center rounded-[var(--radius-control)] border border-primary/30 bg-primary/10 text-primary">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <h3 className="text-heading text-lg font-semibold text-foreground">
          {title}
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-[var(--color-bb-cobalt)] group-hover:gap-2.5 transition-all">
          {cta} <ArrowRight className="size-3.5" />
        </span>
      </div>
    </Link>
  );
}
