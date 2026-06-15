/** Standalone "How it works" page — three-step walkthrough of the Bright.Blue delivery journey */
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Container, Section } from "@/components/ui/section";
import { HowItWorks } from "@/components/catalog/HowItWorks";
import { RidgeArtwork, EditorialEyebrow } from "@/components/brand";

export const metadata: Metadata = {
  title: "How it works",
  description:
    "Bright.Blue delivers experiential activations end-to-end: discovery, install and live performance. Here's how the journey runs.",
};

export default function HowItWorksPage() {
  return (
    <>
      <section
        className="relative isolate overflow-hidden"
        aria-labelledby="how-it-works-hero"
      >
        <div
          aria-hidden
          className="absolute inset-x-0 top-0 ridge-color-cobalt"
          style={{ height: "clamp(320px, 40vw, 480px)" }}
        >
          <RidgeArtwork
            seed="how-it-works"
            lines={28}
            amplitude={90}
            className="text-[hsl(230,93%,53%)]"
          />
          <div
            aria-hidden
            className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-background to-transparent"
          />
        </div>
        <Container size="md" className="relative pt-24 md:pt-32 pb-10">
          <div className="mx-auto max-w-2xl text-center">
            <EditorialEyebrow accent className="mb-3 inline-block">
              The journey
            </EditorialEyebrow>
            <h1
              id="how-it-works-hero"
              className="text-display text-balance text-foreground text-[clamp(2.5rem,5vw,4rem)] leading-[1.1]"
            >
              From brief to brand moment, end-to-end.
            </h1>
            <p className="mt-6 text-lg text-muted-foreground text-balance leading-relaxed">
              Three deliberate moves. We handle the delivery, you keep
              ownership of the brand story.
            </p>
          </div>
        </Container>
      </section>

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
