/**
 * Public role landing page for venues — the venue side of the network story.
 * Outcome-led (what the venue earns), not feature-led; routes to the partner
 * join flow. Companion page: /for-organizers.
 */
import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  CalendarClock,
  Gauge,
  HandCoins,
  Truck,
} from "lucide-react";

import { Container, Section } from "@/components/ui/section";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "For Venues",
  description:
    "Host a Bright.Blue activation and turn quiet days into revenue — rev-share or guarantee economics, zero operational lift, and a live dashboard of what your placement earns.",
};

const STEPS = [
  {
    icon: Truck,
    title: "We place the machine",
    body: "Delivery, install, wrap, and stock — handled by our team, shaped around your floor and your calendar.",
  },
  {
    icon: Gauge,
    title: "Your visitors play",
    body: "A branded, tap-to-play moment your visitors queue for — and every play is measured, not guessed.",
  },
  {
    icon: HandCoins,
    title: "You watch it earn",
    body: "Your portal shows plays, dwell and earnings live. No spreadsheets, no chasing a monthly statement.",
  },
];

const ECONOMICS = [
  {
    title: "Revenue share",
    body: "A percentage of what the placement generates — upside-aligned, no commitment from you.",
  },
  {
    title: "Guarantee + overage",
    body: "A fixed floor for hosting, plus a share above the threshold. Predictable, with upside intact.",
  },
  {
    title: "Zero operational lift",
    body: "We deliver, run, restock and remove. Your team never touches the machine unless they want a go.",
  },
];

export default function ForVenuesPage() {
  return (
    <>
      <Section spacing="md" className="border-b border-border/60">
        <Container>
          <div className="max-w-3xl">
            <p className="text-overline text-brand-cyan mb-3">
              For venues
            </p>
            <h1 className="text-display-grotesk text-4xl text-foreground md:text-6xl">
              Your quiet days are worth money.
            </h1>
            <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
              Shopping centres, exhibition halls, stadiums, leisure spaces —
              every one of them has floor that earns nothing on a Tuesday. A
              hosted Bright.Blue machine turns that floor into measured
              engagement and a revenue line, without adding a single task to
              your team&apos;s day.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button size="lg" variant="brand" asChild>
                <Link href="/partners/join">
                  Become a venue partner
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="glass" asChild>
                <Link href="/login">Already a partner? Sign in</Link>
              </Button>
            </div>
          </div>
        </Container>
      </Section>

      <Section className="border-b border-border/60">
        <Container>
          <div className="mx-auto max-w-2xl text-center mb-14">
            <p className="text-overline text-muted-foreground mb-3">
              How hosting works
            </p>
            <h2 className="text-display-grotesk text-3xl text-foreground md:text-5xl text-balance">
              Three steps. None of them yours.
            </h2>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {STEPS.map((step, i) => (
              <div
                key={step.title}
                className="relative rounded-[var(--radius-card)] border border-border bg-muted/40 p-8"
              >
                <span className="absolute right-6 top-6 text-sm font-semibold tabular-nums text-muted-foreground/40">
                  0{i + 1}
                </span>
                <div className="mb-5 flex size-12 items-center justify-center rounded-[var(--radius-control)] bg-primary/10 ring-1 ring-primary/20">
                  <step.icon className="h-5 w-5 text-primary" aria-hidden />
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
          <div className="grid gap-10 md:grid-cols-[1fr_1.2fr] md:items-start">
            <div>
              <p className="text-overline text-muted-foreground mb-3">
                The economics
              </p>
              <h2 className="text-display-grotesk text-3xl text-foreground md:text-4xl">
                You don&apos;t buy anything. You host, and you earn.
              </h2>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                Hosting terms are shaped to your footfall and your calendar —
                and your portal shows exactly what the placement is doing, so
                the conversation about renewing is a chart, not a pitch.
              </p>
            </div>
            <div className="space-y-4">
              {ECONOMICS.map((item) => (
                <div
                  key={item.title}
                  className="rounded-[var(--radius-card)] border border-border/60 bg-muted/30 p-5"
                >
                  <h3 className="text-base font-semibold text-foreground">
                    {item.title}
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                    {item.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </Container>
      </Section>

      <Section>
        <Container>
          <div className="rounded-[var(--radius-card)] border border-border bg-muted/30 p-8 text-center md:p-12">
            <CalendarClock
              className="mx-auto h-8 w-8 text-primary"
              aria-hidden
            />
            <h2 className="text-display-grotesk mt-4 text-3xl text-foreground md:text-4xl">
              Tell us about your space.
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
              Location, footfall, the days that hurt. We&apos;ll come back with
              what a placement could look like — and what it could earn.
            </p>
            <Button size="lg" variant="brand" className="mt-6" asChild>
              <Link href="/partners/join">
                Become a venue partner
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </Container>
      </Section>
    </>
  );
}
