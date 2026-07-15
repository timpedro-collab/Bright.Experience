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
            <p className="text-overline text-muted-foreground mb-2">The proof</p>
            <h2 className="text-heading text-3xl font-bold text-foreground md:text-4xl">
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

        {/* Hard-number trust tiles */}
        <div className="mt-12 grid grid-cols-1 gap-px overflow-hidden rounded-[var(--radius-card)] border border-white/[0.06] bg-white/[0.04] md:grid-cols-3">
          {TRUST_STATS.map((stat) => (
            <div
              key={stat.label}
              className="bg-[hsl(233,50%,9%)] px-6 py-10 text-center"
            >
              <p className="text-heading text-5xl font-bold text-white tabular-nums md:text-6xl">
                {stat.value}
              </p>
              <p className="mt-2 text-sm text-white/60">{stat.label}</p>
            </div>
          ))}
        </div>
        <p className="mt-4 text-center text-xs text-muted-foreground">
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
    <figure className="flex flex-col justify-between rounded-2xl border border-border bg-muted/40 p-8">
      <div>
        <Quote aria-hidden className="mb-4 h-6 w-6 text-[var(--color-bb-cobalt)]/70" />
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
          <Image
            src={testimonial.logoSrc}
            alt={testimonial.company}
            width={90}
            height={24}
            unoptimized
            className="h-5 w-auto shrink-0 opacity-60 brightness-0"
          />
        )}
      </figcaption>
    </figure>
  );
}
