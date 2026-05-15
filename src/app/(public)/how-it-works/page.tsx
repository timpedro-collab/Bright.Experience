/** Standalone "How it works" page — three-step walkthrough of the Bright.Blue delivery journey */
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Container, Section } from "@/components/ui/section";
import { HowItWorks } from "@/components/catalog/HowItWorks";

export const metadata: Metadata = {
  title: "How it works",
  description:
    "Bright.Blue delivers experiential activations end-to-end: discovery, install and live performance. Here's how the journey runs.",
};

export default function HowItWorksPage() {
  return (
    <>
      <Section className="relative overflow-hidden">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(223,94%,53%,0.16),transparent_60%)]" />
        </div>
        <Container size="md" className="relative">
          <div className="mx-auto max-w-2xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/8 px-3.5 py-1.5">
              <Sparkles size={14} className="text-primary" />
              <span className="text-xs font-medium text-primary">The journey</span>
            </div>
            <h1 className="text-display text-4xl text-balance text-foreground md:text-6xl">
              From brief to brand moment, end-to-end.
            </h1>
            <p className="mt-6 text-lg text-muted-foreground text-balance">
              Three deliberate moves. We handle the delivery, you keep ownership
              of the brand story.
            </p>
          </div>
        </Container>
      </Section>

      <HowItWorks />

      <Section className="border-t border-white/[0.06]">
        <Container size="md">
          <div className="text-center">
            <h2 className="text-heading text-3xl font-bold text-foreground md:text-4xl">
              Ready to plan your activation?
            </h2>
            <p className="mt-3 text-muted-foreground">
              Two-minute fit quiz or a tailored proposal — start wherever feels
              right.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Button size="lg" variant="brand" asChild>
                <Link href="/quiz">
                  Find your fit
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
