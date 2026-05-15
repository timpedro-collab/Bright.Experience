/** All machines index — catalog grid with editorial styling */
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { MachineCard } from "@/components/catalog/MachineCard";
import { Container, Section } from "@/components/ui/section";
import { Button } from "@/components/ui/button";
import { getMachines } from "@/lib/queries/machines";

export const metadata: Metadata = {
  title: "All machines",
  description:
    "Explore our full catalog of interactive Bright.Blue machines — claw machines, prize vendors, photo experiences, and more.",
};

export default async function MachinesIndexPage() {
  const machines = await getMachines();

  return (
    <>
      <Section spacing="md" className="border-b border-white/[0.06]">
        <Container>
          <p className="text-overline text-muted-foreground">Catalog</p>
          <h1 className="text-display mt-2 text-4xl md:text-5xl font-bold text-foreground">
            Our machines
          </h1>
          <p className="mt-3 max-w-2xl text-base text-muted-foreground md:text-lg">
            Every Bright.Blue machine is engineered for crowd-stopping
            experiential moments — prize-rich, brandable, and built around our
            telemetry and reporting stack.
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
      </Section>

      <Section>
        <Container>
          {machines.length === 0 ? (
            <div className="rounded-[var(--radius-card)] border border-white/[0.06] bg-white/[0.02] p-12 text-center text-muted-foreground">
              The machine catalog is being prepared. Please check back soon.
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {machines.map((m, i) => (
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
          )}
        </Container>
      </Section>

      <Section className="border-t border-white/[0.06] bg-[hsl(233,66%,5%,0.5)]" spacing="md">
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
