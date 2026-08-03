/**
 * "Build your business case" — the page a champion forwards to their CFO.
 * Cost-per-lead framing with an interactive calculator against named
 * third-party benchmarks, per docs/20 §2 presentation psychology.
 */
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Container, Section } from "@/components/ui/section";
import { Button } from "@/components/ui/button";
import { CplCalculator } from "@/components/public/business-case/CplCalculator";
import { TRUST_STATS } from "@/lib/marketing/claims";

export const metadata: Metadata = {
  title: "Build Your Business Case",
  description:
    "The cost-per-lead arithmetic for a Bright.Blue activation, next to the trade-show and LinkedIn benchmarks your CFO already knows.",
};

const REPORT_ITEMS = [
  "Plays, unique players, and dwell time — hour by hour",
  "Opted-in leads with full consent trail, ready for your CRM",
  "Peak periods and quiet periods, so the next event is planned on evidence",
  "Board-ready summary within 24 hours of doors closing",
];

export default function BusinessCasePage() {
  return (
    <>
      <Section spacing="md" className="border-b border-border/60">
        <Container>
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground mb-3">
              Build your business case
            </p>
            <h1 className="text-display-grotesk text-4xl text-foreground md:text-6xl">
              The numbers your CFO will ask for.
            </h1>
            <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
              Event spend gets challenged in one currency: cost per lead. Here
              is the arithmetic for an activation, out in the open, next to the
              benchmarks your finance team already knows — set your own lead
              count and check our working.
            </p>
          </div>
        </Container>
      </Section>

      <Section className="border-b border-border/60">
        <Container>
          <CplCalculator />
          <p className="mt-4 text-xs text-muted-foreground">
            Bands from our published{" "}
            <Link href="/pricing" className="underline underline-offset-4 hover:text-foreground">
              tier pricing
            </Link>{" "}
            for 1–3 day activations. Trade-show benchmark: CEIR cost-per-lead
            research; LinkedIn range: published Lead Gen Forms averages. Your
            proposal firms these numbers up for your specific event.
          </p>
        </Container>
      </Section>

      <Section className="border-b border-border/60">
        <Container>
          <div className="grid gap-10 md:grid-cols-[1fr_1.2fr] md:items-start">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground mb-3">
                Why the leads are worth more
              </p>
              <h2 className="text-display-grotesk text-3xl text-foreground md:text-4xl">
                A badge scan is a name. A play is a memory.
              </h2>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                Scanned badges get scanned forty times a day and remember none
                of them. Someone who queued, played your game, won something
                with your name on it, and typed their email in to claim it has
                done something no scanner captures: they&apos;ve spent minutes
                with your brand, voluntarily. That&apos;s the difference your
                sales team feels on the follow-up call.
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-muted/30 p-6 md:p-8">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                What lands in the report
              </p>
              <ul className="mt-4 space-y-3">
                {REPORT_ITEMS.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-foreground/90">
                    <span
                      aria-hidden
                      className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-bb-cobalt)]"
                    />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-6 grid grid-cols-3 gap-4 border-t border-border/60 pt-5">
                {TRUST_STATS.map((stat) => (
                  <div key={stat.label}>
                    <p className="text-xl font-semibold tracking-tight text-foreground">
                      {stat.value}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground leading-snug">
                      {stat.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Container>
      </Section>

      <Section>
        <Container>
          <div className="rounded-2xl border border-border bg-muted/30 p-8 text-center md:p-12">
            <h2 className="text-display-grotesk text-3xl text-foreground md:text-4xl">
              Get the numbers for your event.
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
              Tell us the event, the audience, and the goal — your tailored
              proposal, with projected performance, lands within one business
              day.
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
