/**
 * Catalog hero — editorial introduction with ridge artwork backdrop,
 * tracked uppercase eyebrow, display-type headline, and clear CTAs.
 *
 * Mirrors the <RidgeHero> language used inside the authenticated app
 * so the first impression for cold visitors lines up with the rest of
 * the Bright.Experience design language.
 */
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Container } from "@/components/ui/section";
import { RidgeArtwork, EditorialEyebrow } from "@/components/brand";

const STAT_PILLS = [
  { label: "Live in 12 markets" },
  { label: "92% rebook rate" },
  { label: "1,200+ avg. leads per event" },
];

export function CatalogHero() {
  return (
    <section
      className="relative isolate overflow-hidden"
      aria-labelledby="catalog-hero-title"
    >
      {/* Ridge artwork — deterministic, seeded so the catalog always
          looks the same on repeat visits. */}
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 ridge-color-cobalt"
        style={{ height: "clamp(420px, 56vh, 640px)" }}
      >
        <RidgeArtwork
          seed="catalog::landing"
          lines={36}
          amplitude={110}
          className="text-[hsl(230,93%,53%)]"
        />
        <div
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-background to-transparent"
        />
      </div>

      <Container className="relative py-24 md:py-32">
        <div className="mx-auto max-w-4xl">
          <EditorialEyebrow accent className="mb-3">
            Interactive activations · For events that need to do something
          </EditorialEyebrow>
          <h1
            id="catalog-hero-title"
            className="text-display text-balance text-foreground text-[clamp(2.75rem,6vw,5rem)] leading-[1.05]"
          >
            Capture 1,200+ leads at your next exhibition.
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-muted-foreground text-balance md:text-xl leading-relaxed">
            From booking and brand wrap through to live telemetry, we run
            the entire activation so your team can focus on the story.
          </p>

          <div className="mt-10 flex items-center gap-3 flex-wrap">
            <Link
              href="/quiz"
              className="inline-flex items-center gap-2 bg-[var(--color-bb-cobalt)] text-white px-6 py-3 rounded-sm text-base font-medium hover:opacity-90 transition-opacity"
            >
              Find your match <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="#machines"
              className="inline-flex items-center gap-2 border border-border/60 bg-card/40 text-foreground px-6 py-3 rounded-sm text-base hover:bg-accent/40 transition-colors"
            >
              Explore the catalog
            </Link>
          </div>

          <div className="mt-10 flex items-center gap-2 flex-wrap text-overline text-muted-foreground">
            {STAT_PILLS.map((pill, i) => (
              <span key={pill.label} className="inline-flex items-center gap-2">
                {i > 0 && <span className="opacity-50">·</span>}
                {pill.label}
              </span>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
