/**
 * Homepage hero — proof-led headline in the editorial display serif, a quiz
 * CTA that states its payoff, and the product itself: a real activation
 * photograph with the verified hero stats counting up over it, so "measured
 * to the play" is shown, not claimed. Copy rules live in
 * `src/lib/marketing/claims.ts`; type + motion rationale in
 * `docs/18-design-research.md` (H2, H5).
 */
import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";

import { Container } from "@/components/ui/section";
import { Button } from "@/components/ui/button";
import { FadeIn } from "@/components/ui/motion";
import { StatCountUp } from "@/components/ui/StatCountUp";
import { RidgeArtwork } from "@/components/brand";
import { HERO_STATS, QUIZ_CTA } from "@/lib/marketing/claims";

export function HeroSection() {
  return (
    <section className="relative isolate overflow-hidden">
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 ridge-color-cobalt"
        style={{ height: "clamp(500px, 70vh, 800px)" }}
      >
        <RidgeArtwork
          seed="landing::home"
          lines={40}
          amplitude={120}
          className="text-[hsl(230,93%,53%)]"
        />
        <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-background to-transparent" />
      </div>

      <Container className="relative pt-24 pb-16 md:pt-32 md:pb-24">
        <div className="mx-auto max-w-4xl text-center">
          <FadeIn duration={0.6} y={10}>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-bb-cobalt)] mb-5">
              Make your moment count
            </p>
          </FadeIn>
          {/* Serif display at weight 400 (Momentum pattern): the size does
              the work, the weight stays elegant. Public surfaces only. */}
          <FadeIn duration={0.9} delay={0.05} y={16}>
            <h1 className="text-display-serif text-[clamp(2.75rem,7vw,5.5rem)] text-foreground text-balance">
              Crowd-stopping activations.{" "}
              <span className="bg-gradient-to-r from-[var(--color-bb-cobalt)] to-[var(--color-bb-cyan)] bg-clip-text text-transparent">
                Measured to the play.
              </span>
            </h1>
          </FadeIn>
          <FadeIn duration={0.7} delay={0.15} y={12}>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground md:text-xl leading-relaxed text-balance">
              Branded machines that pull a queue at exhibitions, festivals,
              retail and conferences — and prove it with live numbers while it
              runs and a board-ready report within 24 hours.
            </p>
          </FadeIn>

          <FadeIn duration={0.7} delay={0.25} y={12}>
            <div className="mt-10 flex flex-col items-center gap-3">
              <div className="flex items-center justify-center gap-4 flex-wrap">
                <Button size="lg" variant="brand" asChild>
                  <Link href={QUIZ_CTA.href}>
                    {QUIZ_CTA.label} <ArrowRight className="size-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="glass" asChild>
                  <Link href="#machines">Explore the machines</Link>
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">{QUIZ_CTA.payoff}</p>
            </div>
          </FadeIn>
        </div>

        {/* The product, doing its job: a real activation with a real queue.
            Stats sit on the photograph so the proof reads as telemetry from
            the scene, not marketing copy beside it. */}
        <FadeIn duration={0.9} delay={0.35} y={24}>
          <figure className="relative mx-auto mt-14 max-w-5xl md:mt-20">
            <div className="relative overflow-hidden rounded-[var(--radius-card)] border border-border/60 shadow-[var(--bb-shadow-premium)]">
              <Image
                src="/catalog/machines/hyperion/01-hero-redbull.jpg"
                alt="A crowd gathered around a branded Hyperion vending machine at a UK exhibition, several attendees filming it on their phones"
                width={2048}
                height={780}
                priority
                sizes="(min-width: 1280px) 1024px, 100vw"
                className="w-full object-cover"
              />
              <div
                aria-hidden
                className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent"
              />
              <div className="absolute inset-x-0 bottom-0 flex flex-wrap items-end justify-between gap-3 p-4 md:p-6">
                <div className="flex flex-wrap items-center gap-2 md:gap-3">
                  {HERO_STATS.map((stat) => (
                    <div
                      key={stat.label}
                      className="rounded-full border border-white/20 bg-black/35 px-3.5 py-1.5 backdrop-blur-md md:px-4 md:py-2"
                    >
                      <StatCountUp
                        raw={stat.value}
                        className="text-heading text-sm font-bold text-white tabular-nums md:text-base"
                      />{" "}
                      <span className="text-xs text-white/75 md:text-sm">
                        {stat.label}
                      </span>
                    </div>
                  ))}
                </div>
                <figcaption className="hidden text-xs text-white/70 md:block">
                  Hyperion pulling a queue at a UK exhibition
                </figcaption>
              </div>
            </div>
          </figure>
        </FadeIn>
      </Container>
    </section>
  );
}
