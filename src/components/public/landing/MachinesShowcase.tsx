/**
 * Homepage machines showcase — one row of hero machines with real brand
 * photography. Anchored (#machines) so the hero's secondary CTA lands here.
 */
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Container, Section } from "@/components/ui/section";
import { Button } from "@/components/ui/button";
import { MachineCard } from "@/components/catalog/MachineCard";

interface ShowcaseMachine {
  name: string;
  slug: string;
  tagline?: string;
  heroImageUrl?: string | null;
}

export function MachinesShowcase({ machines }: { machines: ShowcaseMachine[] }) {
  return (
    <Section id="machines" className="border-t border-border/60">
      <Container>
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <p className="text-overline text-muted-foreground mb-2">The hardware</p>
            <h2 className="text-display-serif text-4xl text-foreground md:text-5xl">
              Machines built to earn their floor space
            </h2>
            <p className="mt-2 text-muted-foreground">
              Fully brandable, prize-rich, and instrumented — every unit ships
              with the telemetry stack that turns footfall into proof.
            </p>
          </div>
          <Button variant="glass" size="sm" asChild>
            <Link href="/catalog/machines" className="shrink-0">
              View all machines <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {machines.slice(0, 3).map((m, i) => (
            <MachineCard key={m.slug} machine={m} index={i} />
          ))}
        </div>
      </Container>
    </Section>
  );
}
