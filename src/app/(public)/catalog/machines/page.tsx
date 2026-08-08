/** All machines index — catalog grid with editorial styling */
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { MachineCard } from "@/components/catalog/MachineCard";
import { Container, Section } from "@/components/ui/section";
import { Button } from "@/components/ui/button";
import { RidgeArtwork, EditorialEyebrow } from "@/components/brand";
import { getMachines } from "@/lib/queries/machines";
import { getBenchmarks } from "@/lib/queries/benchmarks";
import {
  playsBenchmarkForMachine,
  formatPlaysBenchmark,
} from "@/lib/metrics/machine-benchmarks";

export const metadata: Metadata = {
  title: "All machines",
  description:
    "Explore our full catalog of interactive Bright.Blue machines — claw machines, prize vendors, photo experiences, and more.",
};

export default async function MachinesIndexPage() {
  const [machines, benchmarks] = await Promise.all([
    getMachines(),
    getBenchmarks(),
  ]);

  return (
    <>
      <section className="relative isolate overflow-hidden border-b border-border/40">
        <div
          aria-hidden
          className="absolute inset-x-0 top-0 ridge-color-cobalt"
          style={{ height: "clamp(240px, 28vw, 320px)" }}
        >
          <RidgeArtwork
            seed="catalog::machines"
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
            The machines.
          </h1>
          <p className="mt-3 max-w-2xl text-base text-muted-foreground md:text-lg leading-relaxed">
            Every Bright.Blue machine is engineered for crowd-stopping
            experiential moments — prize-rich, brandable, and built around
            our telemetry and reporting stack.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            <Button asChild variant="brand">
              <Link href="/quiz">Find your match</Link>
            </Button>
            <Button asChild variant="glass">
              <Link href="/proposal">Get a proposal</Link>
            </Button>
          </div>
        </Container>
      </section>

      <Section>
        <Container>
          {machines.length === 0 ? (
            <div className="rounded-[var(--radius-card)] border border-border/60 bg-muted/40 p-12 text-center text-muted-foreground">
              The machine catalog is being prepared. Please check back soon.
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {machines.map((m, i) => {
                const plays = playsBenchmarkForMachine(m.name, benchmarks);
                return (
                  <MachineCard
                    key={m.slug}
                    machine={{
                      name: m.name,
                      slug: m.slug,
                      tagline: m.tagline ?? undefined,
                      heroImageUrl: m.hero_image_url,
                      capacityLabel: (m as { capacity_label?: string | null }).capacity_label,
                      playsPerDayLabel: plays ? formatPlaysBenchmark(plays) : undefined,
                    }}
                    index={i}
                  />
                );
              })}
            </div>
          )}
        </Container>
      </Section>

      <Section className="border-t border-border/60 bg-muted/30" spacing="md">
        <Container className="text-center">
          <h2 className="text-heading text-2xl font-semibold md:text-3xl">
            Not sure which machine fits?
          </h2>
          <p className="mt-2 text-muted-foreground">
            Our two-minute quiz pairs you with the perfect machine and game
            combo for your event.
          </p>
          <Button asChild variant="brand" size="lg" className="mt-6">
            <Link href="/quiz">
              Take the quiz <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </Container>
      </Section>
    </>
  );
}
