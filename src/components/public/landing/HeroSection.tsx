/**
 * Homepage hero — proof-led headline, verified stat pills (rebook rate
 * first), and a quiz CTA that states its payoff. Copy rules live in
 * `src/lib/marketing/claims.ts`.
 */
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Container } from "@/components/ui/section";
import { Button } from "@/components/ui/button";
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

      <Container className="relative py-28 md:py-40">
        <div className="mx-auto max-w-4xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-bb-cobalt)] mb-5">
            Make your moment count
          </p>
          <h1 className="text-[clamp(2.5rem,7vw,5.25rem)] font-bold leading-[1.04] text-foreground text-balance">
            Crowd-stopping activations.{" "}
            <span className="bg-gradient-to-r from-[var(--color-bb-cobalt)] to-[var(--color-bb-cyan)] bg-clip-text text-transparent">
              Measured to the play.
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground md:text-xl leading-relaxed text-balance">
            Branded machines that pull a queue at exhibitions, festivals,
            retail and conferences — and prove it with live numbers while it
            runs and a board-ready report within 24 hours.
          </p>

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

          <div className="mt-12 flex items-center justify-center gap-2 flex-wrap text-overline text-muted-foreground">
            {HERO_STATS.map((stat, i) => (
              <span key={stat.label} className="inline-flex items-center gap-2">
                {i > 0 && <span className="opacity-50">·</span>}
                <span>
                  <span className="font-semibold text-foreground">{stat.value}</span>{" "}
                  {stat.label}
                </span>
              </span>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
