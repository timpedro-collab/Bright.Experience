/**
 * "Let's plan ___" — sentence-completion navigation (Freeman pattern,
 * docs/18-design-research.md H3). The visitor self-selects by finishing a
 * sentence about their own event; each completion routes into the quiz with
 * the event type pre-seeded, so they arrive at question two instead of
 * question one.
 */
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Container, Section } from "@/components/ui/section";
import { Reveal } from "@/components/ui/motion";

const COMPLETIONS: { label: string; type: string }[] = [
  { label: "your trade show stand", type: "trade-show" },
  { label: "your festival sampling tour", type: "festival" },
  { label: "your retail activation", type: "experiential-activation" },
  { label: "your conference lead capture", type: "conference" },
  { label: "your company celebration", type: "corporate" },
];

export function LetsPlanSection() {
  return (
    <Section className="relative overflow-hidden border-t border-border/60">
      {/* Giant outlined word bleeding off-canvas (On Board pattern) — pure
          confidence, zero cost. Used once on the page, here. */}
      <span
        aria-hidden
        className="pointer-events-none absolute -right-[4vw] -top-[7vw] select-none text-[22vw] font-bold leading-none text-transparent opacity-[0.35]"
        style={{ WebkitTextStroke: "2px hsl(230, 93%, 53%, 0.14)" }}
      >
        Plan
      </span>

      <Container className="relative">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:gap-20">
          <Reveal>
            <p className="text-overline text-muted-foreground mb-3">
              Where to begin
            </p>
            <h2 className="text-display-grotesk text-5xl text-foreground md:text-6xl">
              Let&apos;s plan
            </h2>
            <p className="mt-4 max-w-sm text-muted-foreground leading-relaxed">
              Finish the sentence and we&apos;ll pick it up from there — the
              right machine, the reach you can expect, and a plan for the day.
            </p>
          </Reveal>

          <ul className="flex flex-col">
            {COMPLETIONS.map((completion, i) => (
              <Reveal key={completion.type} delay={i * 0.06} amount={0.5}>
                <li className="border-b border-border/70 first:border-t">
                  <Link
                    href={`/quiz?type=${completion.type}`}
                    className="group flex items-center justify-between gap-6 py-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                  >
                    <span className="text-xl text-muted-foreground transition-colors duration-[var(--bb-duration-base)] group-hover:text-foreground md:text-2xl">
                      {completion.label}
                    </span>
                    <ArrowRight
                      aria-hidden
                      className="size-5 shrink-0 text-muted-foreground/50 transition-all duration-[var(--bb-duration-base)] group-hover:translate-x-1 group-hover:text-[var(--color-bb-cobalt)]"
                    />
                  </Link>
                </li>
              </Reveal>
            ))}
          </ul>
        </div>
      </Container>
    </Section>
  );
}
