/**
 * Get-a-proposal intake — guided wizard for bespoke experiential quotes.
 *
 * Editorial Bright.Experience design language: ridge artwork backdrop on
 * the hero, tracked uppercase eyebrow, display-type headline, and the
 * intake wizard sits in a calm centred column below.
 */

import type { Metadata } from "next";
import { Suspense } from "react";

import { Container, Section } from "@/components/ui/section";
import { IntakeWizard } from "@/components/quotes/IntakeWizard";
import { RidgeArtwork, EditorialEyebrow } from "@/components/brand";

export const metadata: Metadata = {
  title: "Your tailored proposal",
  description:
    "A short conversation about your event. We'll craft pricing, creative options and projected outcomes — and have it back to you within 24 hours.",
};

export default function ProposalPage() {
  return (
    <>
      <section
        className="relative isolate overflow-hidden"
        aria-labelledby="proposal-hero"
      >
        <div
          aria-hidden
          className="absolute inset-x-0 top-0 ridge-color-cobalt"
          style={{ height: "clamp(280px, 36vw, 420px)" }}
        >
          <RidgeArtwork
            seed="proposal::intake"
            lines={26}
            amplitude={80}
            className="text-[hsl(230,93%,53%)]"
          />
          <div
            aria-hidden
            className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-background to-transparent"
          />
        </div>
        <Container size="sm" className="relative pt-20 md:pt-28 pb-10">
          <div className="text-center">
            <EditorialEyebrow accent className="mb-3 inline-block">
              A short conversation
            </EditorialEyebrow>
            <h1
              id="proposal-hero"
              className="text-display text-foreground text-[clamp(2.5rem,5vw,4rem)] leading-[1.1]"
            >
              Let&apos;s price your moment.
            </h1>
            <p className="mt-4 max-w-2xl mx-auto text-muted-foreground md:text-lg leading-relaxed">
              A few quick questions about the event you have in mind. We&apos;ll
              have a tailored proposal back to you within 24 hours.
            </p>
          </div>
        </Container>
      </section>

      <Section className="pt-0">
        <Container size="sm">
          <Suspense fallback={null}>
            <IntakeWizard />
          </Suspense>
        </Container>
      </Section>
    </>
  );
}
