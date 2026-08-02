/**
 * Quiz page — "find your fit" guided recommendation flow.
 *
 * Editorial Bright.Experience design language: ridge artwork backdrop,
 * tracked uppercase eyebrow, display-type headline, calm centred column.
 */

import type { Metadata } from "next";

import { Container, Section } from "@/components/ui/section";
import { RecommendationQuiz } from "@/components/catalog/quiz/RecommendationQuiz";
import { isQuizEventType } from "@/components/catalog/quiz/quiz-data";
import { getMachines } from "@/lib/queries/machines";
import { RidgeArtwork, EditorialEyebrow } from "@/components/brand";

export const metadata: Metadata = {
  title: "Find your fit",
  description:
    "Tell us about your moment and we'll suggest the Bright.Blue activation that fits.",
};

interface QuizPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function QuizPage({ searchParams }: QuizPageProps) {
  const params = await searchParams;
  // "Let's plan ___" homepage links pre-seed the first answer via ?type=,
  // so a visitor who self-selected arrives at question two.
  const rawType = typeof params.type === "string" ? params.type : undefined;
  const initialEventType =
    rawType && isQuizEventType(rawType) ? rawType : undefined;
  const machines = await getMachines();

  return (
    <>
      <section
        className="relative isolate overflow-hidden"
        aria-labelledby="quiz-hero"
      >
        <div
          aria-hidden
          className="absolute inset-x-0 top-0 ridge-color-cobalt"
          style={{ height: "clamp(280px, 36vw, 420px)" }}
        >
          <RidgeArtwork
            seed="quiz::intake"
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
              Two minutes · Six questions
            </EditorialEyebrow>
            <h1
              id="quiz-hero"
              className="text-display text-foreground text-[clamp(2.5rem,5vw,4rem)] leading-[1.1]"
            >
              Let&apos;s make your moment count.
            </h1>
            <p className="mt-4 max-w-2xl mx-auto text-muted-foreground md:text-lg leading-relaxed">
              A short conversation about the event you have in mind. At the
              end, one tailored suggestion — no comparison table, no
              commitment.
            </p>
          </div>
        </Container>
      </section>

      <Section className="pt-0">
        <Container size="sm">
          <RecommendationQuiz
            machines={machines}
            initialEventType={initialEventType}
          />
        </Container>
      </Section>
    </>
  );
}
