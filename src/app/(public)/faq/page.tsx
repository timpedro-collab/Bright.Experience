/**
 * Plain-language FAQ — the questions buyers actually ask (cost, ROI, speed,
 * logistics, data), answered without jargon. Native-details disclosures, no
 * client JS.
 */
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Container, Section } from "@/components/ui/section";
import { Button } from "@/components/ui/button";
import { CollapsibleSection } from "@/components/ui/CollapsibleSection";

export const metadata: Metadata = {
  title: "FAQ",
  description:
    "Straight answers on what a Bright.Blue activation costs, how fast it ships, what it needs on site, and how the data side works.",
};

interface Faq {
  q: string;
  a: React.ReactNode;
}

const GROUPS: { heading: string; faqs: Faq[] }[] = [
  {
    heading: "Cost & value",
    faqs: [
      {
        q: "What does it cost?",
        a: (
          <>
            UK event activations start at £9,500 for 1–3 days, in three tiers
            depending on how much data and proof you want — the bands are
            published on our <Link href="/pricing" className="underline underline-offset-4">pricing page</Link>,
            including US and EU numbers. Multi-week programs, tours and custom
            builds are quoted bespoke.
          </>
        ),
      },
      {
        q: "Why is this more than hiring an arcade machine?",
        a: "Commodity hire gets you hardware in a van. An activation gets you a machine wrapped and skinned to your brand, a game chosen for your audience, delivery, install, running and breakdown handled, and — depending on tier — opted-in lead capture, a trained host, live telemetry, and a board-ready report within 24 hours. You're buying the outcome, not the box.",
      },
      {
        q: "How do I justify the spend internally?",
        a: (
          <>
            In the currency your CFO uses: cost per opted-in lead. At typical
            capture volumes an activation lands well under trade-show and
            LinkedIn benchmarks — do the arithmetic yourself on the{" "}
            <Link href="/business-case" className="underline underline-offset-4">business-case page</Link>.
          </>
        ),
      },
      {
        q: "Are there hidden costs?",
        a: "No. Delivery, install, breakdown, the wrap and the game skin are in every tier. Optional extras — sampling stock mechanics, age gates, on-unit payments, survey layers — are priced as named line items in your proposal before you commit.",
      },
    ],
  },
  {
    heading: "Speed & logistics",
    faqs: [
      {
        q: "How much notice do you need?",
        a: "Machines are physical inventory and popular event dates genuinely book out 6–8 weeks ahead. We can move faster when the calendar allows — ask, and we'll tell you honestly what's possible for your date.",
      },
      {
        q: "What do we need to provide on site?",
        a: "A standard power socket and the floor space. Footprint, weight, power draw and clearances are specified per machine in your proposal, in the format venues and organisers ask for — everything else is on us.",
      },
      {
        q: "Who runs the machine during the event?",
        a: "The machines run themselves — that's the point. Our team handles delivery, install, restocks and collection. On the Lead Engine tier and up, a trained host works the stand with it.",
      },
      {
        q: "What happens if something goes wrong mid-event?",
        a: "Every live activation is monitored — the machines report their own status, and our events team is on call for the duration. Stock running low or a fault flags to us before it flags to you.",
      },
    ],
  },
  {
    heading: "Data & compliance",
    faqs: [
      {
        q: "Is the lead capture GDPR-compliant?",
        a: "Yes, by construction. Every lead opts in through a consent screen (the wording is editable per event and can go past your legal team first), business-domain rules filter out personal email addresses where you want B2B data only, and retention windows are set per event.",
      },
      {
        q: "Who owns the leads?",
        a: "You do. We capture and process them for your event, you export them whenever you like, and they're deleted on the retention schedule agreed for the event.",
      },
      {
        q: "When do we see results?",
        a: "Depends on tier: every activation gets a post-event summary; Lead Engine adds a board-ready proof-of-performance report within 24 hours of doors closing; Command gives your team a live dashboard while the event is still running.",
      },
    ],
  },
  {
    heading: "Working with us",
    faqs: [
      {
        q: "How do we start?",
        a: (
          <>
            Two ways: the{" "}
            <Link href="/quiz" className="underline underline-offset-4">60-second match quiz</Link>{" "}
            recommends the right machine and setup instantly, or go straight to a{" "}
            <Link href="/proposal" className="underline underline-offset-4">tailored proposal</Link>{" "}
            — it lands within one business day, walked through live on a short call.
          </>
        ),
      },
      {
        q: "Can our agency book on our behalf?",
        a: (
          <>
            Yes — agencies and planners work on commissionable trade terms.{" "}
            <Link href="/pricing?for=agency" className="underline underline-offset-4">
              See the agency view of pricing
            </Link>
            .
          </>
        ),
      },
      {
        q: "Do you work outside the UK?",
        a: "Yes — we operate from London, Milton Keynes, Minneapolis, Prague and Dubai, with published pricing for UK, US and EU events. Other regions are priced on application.",
      },
    ],
  },
];

export default function FaqPage() {
  return (
    <>
      <Section spacing="md" className="border-b border-border/60">
        <Container>
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground mb-3">
              FAQ
            </p>
            <h1 className="text-display-grotesk text-4xl text-foreground md:text-6xl">
              Straight answers.
            </h1>
            <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
              Cost, speed, logistics, and what happens to the data — the
              questions every buyer asks, answered the way we&apos;d want them
              answered.
            </p>
          </div>
        </Container>
      </Section>

      <Section>
        <Container>
          <div className="mx-auto max-w-3xl space-y-12">
            {GROUPS.map((group) => (
              <div key={group.heading}>
                <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground mb-4">
                  {group.heading}
                </h2>
                <div className="space-y-3">
                  {group.faqs.map((faq) => (
                    <CollapsibleSection key={faq.q} title={faq.q}>
                      <p className="text-sm leading-relaxed text-muted-foreground">
                        {faq.a}
                      </p>
                    </CollapsibleSection>
                  ))}
                </div>
              </div>
            ))}

            <div className="rounded-2xl border border-border bg-muted/30 p-8 text-center">
              <h2 className="text-display-grotesk text-2xl text-foreground md:text-3xl">
                Something we didn&apos;t cover?
              </h2>
              <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
                Ask a human. hello@brightblue.com — or get a tailored proposal
                and ask everything on the walkthrough call.
              </p>
              <Button variant="brand" className="mt-5" asChild>
                <Link href="/proposal">
                  Get a proposal
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}
