/** Quiz page — premium intake for the "find your fit" recommendation flow */
import type { Metadata } from "next";
import { Sparkles } from "lucide-react";

import { Container, Section } from "@/components/ui/section";
import { RecommendationQuiz } from "@/components/catalog/RecommendationQuiz";
import { getMachines } from "@/lib/queries/machines";

export const metadata: Metadata = {
  title: "Find your fit",
  description:
    "Tell us about your moment and we'll suggest the Bright.Blue activation that fits.",
};

export default async function QuizPage() {
  const machines = await getMachines();

  return (
    <Section className="relative overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(223,94%,53%,0.18),transparent_55%)]" />
      </div>
      <Container size="sm" className="relative">
        <div className="mb-10 text-center">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/8 px-3.5 py-1.5">
            <Sparkles size={14} className="text-primary" />
            <span className="text-xs font-medium text-primary">Two minutes, five questions</span>
          </div>
          <h1 className="text-display text-4xl text-foreground md:text-5xl">
            Let's make your moment count
          </h1>
          <p className="mt-4 max-w-2xl mx-auto text-muted-foreground md:text-lg">
            A short conversation about the event you have in mind. At the end,
            one tailored suggestion — no comparison table, no commitment.
          </p>
        </div>
        <RecommendationQuiz machines={machines} />
      </Container>
    </Section>
  );
}
