/**
 * Homepage closing CTA — quiz with stated payoff, a talk-to-us path for
 * buyers who want a human, and the single honest scarcity line.
 */
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Container, Section } from "@/components/ui/section";
import { Button } from "@/components/ui/button";
import { QUIZ_CTA, SCARCITY_LINE } from "@/lib/marketing/claims";

export function FinalCta() {
  return (
    <Section className="border-t border-border/60">
      <Container size="md">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-foreground md:text-4xl">
            Plan your next activation
          </h2>
          <p className="mt-3 text-muted-foreground max-w-lg mx-auto">
            {QUIZ_CTA.payoff}
          </p>
          <div className="mt-8 flex justify-center gap-3 flex-wrap">
            <Button size="lg" variant="brand" asChild>
              <Link href={QUIZ_CTA.href}>
                {QUIZ_CTA.label} <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button size="lg" variant="glass" asChild>
              <Link href="/proposal">Talk to us</Link>
            </Button>
          </div>
          <p className="mt-6 text-xs text-muted-foreground">{SCARCITY_LINE}</p>
        </div>
      </Container>
    </Section>
  );
}
