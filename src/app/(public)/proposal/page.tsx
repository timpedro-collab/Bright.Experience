/** Get-a-proposal intake — guided wizard for bespoke experiential quotes */
import type { Metadata } from "next";
import { Suspense } from "react";
import { Sparkles } from "lucide-react";

import { Container, Section } from "@/components/ui/section";
import { IntakeWizard } from "@/components/quotes/IntakeWizard";

export const metadata: Metadata = {
  title: "Your tailored proposal",
  description:
    "A short conversation about your event. We'll craft pricing, creative options and projected outcomes — and have it back to you within 24 hours.",
};

export default function ProposalPage() {
  return (
    <Section className="relative overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(189,100%,75%,0.08),transparent_55%)]" />
      </div>
      <Container size="sm" className="relative">
        <div className="mb-10 text-center">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/8 px-3.5 py-1.5">
            <Sparkles size={14} className="text-primary" />
            <span className="text-xs font-medium text-primary">A short conversation</span>
          </div>
          <h1 className="text-display text-4xl text-foreground md:text-5xl">
            Let's price your moment.
          </h1>
          <p className="mt-4 max-w-2xl mx-auto text-muted-foreground md:text-lg">
            A few quick questions about the event you have in mind — we'll have
            a tailored proposal back to you within 24 hours.
          </p>
        </div>
        <Suspense fallback={null}>
          <IntakeWizard />
        </Suspense>
      </Container>
    </Section>
  );
}
