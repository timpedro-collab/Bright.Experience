/** Public partner application — no auth required. */
import type { Metadata } from "next";

import { Container, Section } from "@/components/ui/section";
import { PartnerOnboardingWizard } from "@/components/partners/PartnerOnboardingWizard";
import { RidgeArtwork, EditorialEyebrow } from "@/components/brand";

export const metadata: Metadata = {
  title: "Become a Partner",
  description:
    "Join the Bright.Blue partner programme and earn commission on every referral — whether you're a reseller, agency, or referrer.",
};

export default function PartnerJoinPage() {
  return (
    <>
      <section
        className="relative isolate overflow-hidden"
        aria-labelledby="partner-hero"
      >
        <div
          aria-hidden
          className="absolute inset-x-0 top-0 ridge-color-cobalt"
          style={{ height: "clamp(280px, 32vw, 380px)" }}
        >
          <RidgeArtwork
            seed="partners::join"
            lines={26}
            amplitude={80}
            className="text-[hsl(223,94%,53%)]"
          />
          <div
            aria-hidden
            className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-background to-transparent"
          />
        </div>
        <Container size="md" className="relative pt-20 md:pt-24 pb-10 text-center">
          <EditorialEyebrow accent className="mb-3 inline-block">
            Earn with every referral
          </EditorialEyebrow>
          <h1
            id="partner-hero"
            className="text-display text-foreground text-[clamp(2.25rem,4.5vw,3.5rem)] leading-[1.1]"
          >
            Become a Bright.Blue partner.
          </h1>
          <p className="mt-4 max-w-xl mx-auto text-muted-foreground md:text-lg leading-relaxed">
            Join our partner programme and earn commission for every client
            you refer. Whether you&apos;re a referral partner, reseller, or
            agency — we have a model that works for you.
          </p>
        </Container>
      </section>

      <Section className="pt-0">
        <Container size="md">
          <PartnerOnboardingWizard />
        </Container>
      </Section>
    </>
  );
}
