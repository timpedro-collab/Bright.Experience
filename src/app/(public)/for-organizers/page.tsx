/**
 * Public role landing page for event organizers — the organizer side of the
 * network story. Sells the resale motion (wholesale margin, co-branded pitch
 * links, zero fulfilment lift); routes to the partner join flow.
 * Companion page: /for-venues.
 */
import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BadgePercent,
  LineChart,
  Link2,
  ShieldCheck,
} from "lucide-react";

import { Container, Section } from "@/components/ui/section";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "For Event Organizers",
  description:
    "Add a measured, branded activation to your sponsorship prospectus. Wholesale terms, co-branded pitch links, and full delivery by Bright.Blue — your margin, your sponsor relationship.",
};

const SELL_POINTS = [
  {
    icon: BadgePercent,
    title: "Your price, your margin",
    body: "You buy on wholesale terms and set your own sponsor-facing price. The gap is yours — we never undercut you with your sponsor.",
  },
  {
    icon: Link2,
    title: "Pitch links that close",
    body: "Co-branded, private links your reps can send the same afternoon: the machine, the sponsor's branding, and the numbers it's expected to do.",
  },
  {
    icon: ShieldCheck,
    title: "We fulfil everything",
    body: "Delivery, install, wrap, staffing, restocks, teardown. Your operations team adds a line to the floor plan, not a workstream.",
  },
  {
    icon: LineChart,
    title: "Proof your sponsor renews on",
    body: "Plays, dwell, opted-in leads — reported per machine, per sponsor. Renewal conversations become a chart, not a negotiation.",
  },
];

const STEPS = [
  {
    title: "Add machines to your prospectus",
    body: "Top-tier or add-on inventory — a measured activation slots straight into your existing sponsorship matrix.",
  },
  {
    title: "Pitch with a link, not a PDF",
    body: "Every slot gets a private, co-branded pitch page with expected performance. Your rep sends it; we see nothing of your pipeline.",
  },
  {
    title: "We deliver, you invoice",
    body: "Once a sponsor signs, fulfilment is ours end to end. You invoice your sponsor at your price; the post-show report carries your show's name.",
  },
];

export default function ForOrganizersPage() {
  return (
    <>
      <Section spacing="md" className="border-b border-border/60">
        <Container>
          <div className="max-w-3xl">
            <p className="text-overline text-brand-cyan mb-3">
              For event organizers
            </p>
            <h1 className="text-display-grotesk text-4xl text-foreground md:text-6xl">
              The easiest line in your prospectus to sell.
            </h1>
            <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
              Sponsors are tired of buying logo placements they can&apos;t
              measure. A branded, tap-to-play machine on your floor is the
              inventory that sells itself — the crowd it pulls is the demo, and
              the report it produces is the renewal.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button size="lg" variant="brand" asChild>
                <Link href="/partners/join">
                  Talk wholesale terms
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
              Why organizers resell it
            </p>
            <h2 className="text-display-grotesk text-3xl text-foreground md:text-5xl text-balance">
              New revenue. No new headcount.
            </h2>
          </div>
          <div className="grid gap-6 sm:grid-cols-2">
            {SELL_POINTS.map((point) => (
              <div
                key={point.title}
                className="rounded-[var(--radius-card)] border border-border bg-muted/40 p-8"
              >
                <div className="mb-5 flex size-12 items-center justify-center rounded-[var(--radius-control)] bg-primary/10 ring-1 ring-primary/20">
                  <point.icon
                    className="h-5 w-5 text-primary"
                    aria-hidden
                  />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {point.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {point.body}
                </p>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      <Section className="border-b border-border/60">
        <Container>
          <div className="grid gap-10 md:grid-cols-[1fr_1.3fr] md:items-start">
            <div>
              <p className="text-overline text-muted-foreground mb-3">
                The motion
              </p>
              <h2 className="text-display-grotesk text-3xl text-foreground md:text-4xl">
                Pitch, price, and close in one meeting.
              </h2>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                Your sales team already knows how to sell sponsorship. We give
                them inventory that demos itself and the collateral to close it
                — without adding a fulfilment burden to your show.
              </p>
            </div>
            <ol className="space-y-4">
              {STEPS.map((step, i) => (
                <li
                  key={step.title}
                  className="flex gap-4 rounded-[var(--radius-card)] border border-border/60 bg-muted/30 p-5"
                >
                  <span className="text-lg font-semibold tabular-nums text-primary">
                    {i + 1}
                  </span>
                  <div>
                    <h3 className="text-base font-semibold text-foreground">
                      {step.title}
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                      {step.body}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </Container>
      </Section>

      <Section>
        <Container>
          <div className="rounded-[var(--radius-card)] border border-border bg-muted/30 p-8 text-center md:p-12">
            <h2 className="text-display-grotesk text-3xl text-foreground md:text-4xl">
              Put a machine in your next prospectus.
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
              Tell us about your shows and we&apos;ll send the wholesale deck —
              pricing, expected performance by venue type, and the pitch
              collateral your reps will actually use.
            </p>
            <Button size="lg" variant="brand" className="mt-6" asChild>
              <Link href="/partners/join">
                Talk wholesale terms
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </Container>
      </Section>
    </>
  );
}
