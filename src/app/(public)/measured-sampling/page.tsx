/**
 * "Measured Sampling" campaign landing page — the <1% vs 100% contrast.
 * Traditional sampling hands out product and learns almost nothing; sampling
 * through a machine makes every dispense a measured, opted-in interaction.
 * Target audience: FMCG / brand teams running sampling budgets.
 */
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Gamepad2, Gift, ScanLine } from "lucide-react";

import { Container, Section } from "@/components/ui/section";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Measured Sampling",
  description:
    "Traditional sampling hands out thousands of units and learns almost nothing. Measured sampling makes every dispense an opted-in, counted, attributable interaction.",
};

const HOW = [
  {
    icon: Gamepad2,
    title: "They play",
    body: "A branded game stops the crowd — the sample is the prize, not a hand-out to be dodged.",
  },
  {
    icon: ScanLine,
    title: "They opt in",
    body: "One GDPR-compliant screen between play and prize. Every sample now has a name, a consent record, and a timestamp.",
  },
  {
    icon: Gift,
    title: "It dispenses",
    body: "The machine vends the product — chilled, sized, and counted. Stock levels report themselves in real time.",
  },
];

const LEARNINGS = [
  "Exactly how many samples went out, hour by hour — no estimates off pallet counts",
  "Who took one: opted-in contact data, not a guess at demographics",
  "Where and when demand peaked, so the next drop is planned on evidence",
  "What happened next — follow-up journeys sent to people who actually tried the product",
];

export default function MeasuredSamplingPage() {
  return (
    <>
      <Section spacing="md" className="border-b border-border/60">
        <Container>
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground mb-3">
              Measured sampling
            </p>
            <h1 className="text-display-grotesk text-4xl text-foreground md:text-6xl">
              You paid for 10,000 samples. What did you learn?
            </h1>
            <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
              Traditional sampling is a leap of faith: staff hand out product,
              the pallets empty, and the report says &ldquo;we think it went
              well.&rdquo; Almost none of it is measured, and none of it is
              attributable. Sampling through a machine changes the physics —
              every unit dispensed is a person who chose to engage, opted in,
              and can be followed up.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button size="lg" variant="brand" asChild>
                <Link href="/proposal">
                  Plan a measured sampling run
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="glass" asChild>
                <Link href="/catalog/machines">See the machines</Link>
              </Button>
            </div>
          </div>
        </Container>
      </Section>

      <Section className="border-b border-border/60">
        <Container>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl border border-border bg-muted/40 p-8">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Sampling as it is
              </p>
              <p className="mt-4 text-3xl font-semibold tracking-tight text-foreground">
                &lt;1% measured
              </p>
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                Units handed to whoever walks past. No record of who, no
                consent, no follow-up. The only hard number is how many boxes
                came back on the van.
              </p>
            </div>
            <div className="rounded-2xl border border-[var(--color-bb-cobalt)]/40 bg-[var(--color-bb-cobalt)]/[0.04] p-8">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Sampling through a machine
              </p>
              <p className="mt-4 text-3xl font-semibold tracking-tight text-foreground">
                100% counted, opt-in by choice
              </p>
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                Every dispense is triggered by a play, tied to a consented
                contact where you want one, and counted the moment it happens.
                The report writes itself while the event is still running.
              </p>
            </div>
          </div>
        </Container>
      </Section>

      <Section className="border-b border-border/60">
        <Container>
          <div className="mx-auto max-w-2xl text-center mb-14">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground mb-3">
              How it works
            </p>
            <h2 className="text-display-grotesk text-3xl text-foreground md:text-5xl text-balance">
              The sample becomes the prize.
            </h2>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {HOW.map((step, i) => (
              <div
                key={step.title}
                className="relative rounded-2xl border border-border bg-muted/40 p-8"
              >
                <span className="absolute right-6 top-6 text-sm font-semibold tabular-nums text-muted-foreground/40">
                  0{i + 1}
                </span>
                <div className="mb-5 flex size-12 items-center justify-center rounded-xl bg-[var(--color-bb-cobalt)]/10 ring-1 ring-[var(--color-bb-cobalt)]/20">
                  <step.icon className="h-5 w-5 text-[var(--color-bb-cobalt)]" aria-hidden />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {step.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {step.body}
                </p>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      <Section className="border-b border-border/60">
        <Container>
          <div className="grid gap-10 md:grid-cols-[1fr_1.2fr] md:items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground mb-3">
                What you learn
              </p>
              <h2 className="text-display-grotesk text-3xl text-foreground md:text-4xl">
                A sampling budget that reports like a media budget.
              </h2>
            </div>
            <ul className="space-y-3">
              {LEARNINGS.map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-3 rounded-[var(--radius-card)] border border-border/50 bg-muted/20 p-4 text-sm leading-relaxed text-foreground/90"
                >
                  <span
                    aria-hidden
                    className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-bb-cobalt)]"
                  />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </Container>
      </Section>

      <Section>
        <Container>
          <div className="rounded-2xl border border-border bg-muted/30 p-8 text-center md:p-12">
            <h2 className="text-display-grotesk text-3xl text-foreground md:text-4xl">
              Make the next sampling run count. Literally.
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
              Tell us the product, the audience, and the venue — we&apos;ll
              come back within one business day with the machine, the game,
              and the numbers to expect.
            </p>
            <Button size="lg" variant="brand" className="mt-6" asChild>
              <Link href="/proposal">
                Get a proposal
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </Container>
      </Section>
    </>
  );
}
