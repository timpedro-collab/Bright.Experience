/**
 * Homepage proof section — the evidence block. Case studies with real
 * telemetry numbers, three hard-number trust tiles (GDPR is a caption, not
 * a tile), and both full client testimonials side by side.
 */
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Quote } from "lucide-react";

import { Container, Section } from "@/components/ui/section";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/ui/motion";
import { StatCountUp } from "@/components/ui/StatCountUp";
import { CaseStudyCard } from "@/components/catalog/CaseStudyCard";
import {
  TRUST_STATS,
  TRUST_CAPTION,
  TESTIMONIALS,
  type Testimonial,
} from "@/lib/marketing/claims";

interface ProofCaseStudy {
  title: string;
  slug: string;
  clientName?: string;
  location?: string;
  heroImageUrl?: string;
  statsJson?: Record<string, unknown>;
}

export function ProofSection({ caseStudies }: { caseStudies: ProofCaseStudy[] }) {
  return (
    <Section className="border-t border-border/60">
      <Container>
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <p className="text-overline text-brand-cyan mb-2">The proof</p>
            <h2 className="text-display-grotesk text-4xl text-foreground md:text-5xl">
              Real activations, real numbers
            </h2>
            <p className="mt-2 text-muted-foreground">
              Every activation is measured to the play — so the results below
              come from telemetry, not estimates.
            </p>
          </div>
          <Button variant="glass" size="sm" asChild>
            <Link href="/catalog/case-studies" className="shrink-0">
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>

        {caseStudies.length > 0 && (
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {caseStudies.slice(0, 3).map((cs, i) => (
              <CaseStudyCard key={cs.slug} caseStudy={cs} index={i} />
            ))}
          </div>
        )}

        {/* Hard numbers, bare on the page (On Board pattern): no card, no
            border — the number is huge and everything around it stays quiet,
            so nothing competes with the figure. Counts up once on scroll. */}
        <div className="mt-16 grid grid-cols-1 gap-12 md:mt-20 md:grid-cols-3 md:gap-8">
          {TRUST_STATS.map((stat, i) => (
            <Reveal key={stat.label} delay={i * 0.1} className="text-center">
              <p className="text-heading text-7xl font-bold leading-none tracking-tight text-foreground tabular-nums md:text-8xl">
                <StatCountUp
                  raw={stat.value}
                  prefixClassName="block text-[0.22em] font-semibold uppercase tracking-[0.18em] text-muted-foreground mb-2"
                />
              </p>
              <p className="mx-auto mt-3 max-w-[16rem] text-sm leading-snug text-muted-foreground">
                {stat.label}
              </p>
            </Reveal>
          ))}
        </div>
        <p className="mt-10 text-center text-xs text-muted-foreground">
          {TRUST_CAPTION}
        </p>

        {/* Dual testimonials */}
        <div className="mt-14 grid gap-6 lg:grid-cols-2">
          {TESTIMONIALS.map((t) => (
            <TestimonialCard key={t.company} testimonial={t} />
          ))}
        </div>
      </Container>
    </Section>
  );
}

function TestimonialCard({ testimonial }: { testimonial: Testimonial }) {
  return (
    <figure className="flex flex-col justify-between rounded-[var(--radius-card)] border border-border bg-card p-8">
      <div>
        <Quote aria-hidden className="mb-4 h-6 w-6 text-primary/70" />
        <blockquote className="text-heading text-lg leading-relaxed text-foreground text-balance">
          &ldquo;{testimonial.text}&rdquo;
        </blockquote>
      </div>
      <figcaption className="mt-6 flex items-center justify-between gap-4 border-t border-border pt-5">
        <div className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{testimonial.author}</span>
          {" · "}
          {testimonial.role}
          {" · "}
          <span className="text-foreground/80">{testimonial.company}</span>
        </div>
        {testimonial.logoSrc && (
          /* Light chip so dark-ink client logos survive the Ink canvas
             (design-language §6) — bg-white/90 is a justified literal. */
          <span className="shrink-0 rounded-md bg-white/90 px-2 py-1.5">
            <Image
              src={testimonial.logoSrc}
              alt={testimonial.company}
              width={90}
              height={24}
              unoptimized
              className="h-4 w-auto brightness-0"
            />
          </span>
        )}
      </figcaption>
    </figure>
  );
}
