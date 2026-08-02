/** "How it works" three-step block for the catalog landing */
import { Compass, Sparkles, BarChart3 } from "lucide-react";

import { Container, Section } from "@/components/ui/section";

const STEPS = [
  {
    icon: Compass,
    eyebrow: "Step 01",
    title: "Choose your activation",
    description:
      "Pick a Bright.Blue machine and game combination — or let our two-minute quiz suggest the perfect pairing for your event objective.",
  },
  {
    icon: Sparkles,
    eyebrow: "Step 02",
    title: "We deliver, install & QA",
    description:
      "Our delivery team installs, brand-wraps and QA-tests the unit. You get a single dashboard for assets, approvals and event logistics.",
  },
  {
    icon: BarChart3,
    eyebrow: "Step 03",
    title: "Watch performance live",
    description:
      "Real-time interactions, leads and prize delivery — followed by a shareable proof-of-performance report with benchmarks and ROI.",
  },
];

export function HowItWorks() {
  return (
    <Section spacing="lg" className="border-t border-border/60">
      <Container>
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <p className="text-overline text-muted-foreground mb-2">How it works</p>
          <h2 className="text-display-serif text-4xl text-foreground md:text-5xl">
            From discovery to ROI in three moves
          </h2>
          <p className="mt-3 text-muted-foreground">
            We&apos;ve reimagined the experiential delivery journey end-to-end so
            you can focus on the brand story, not the logistics.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {STEPS.map(({ icon: Icon, eyebrow, title, description }, i) => (
            <div
              key={eyebrow}
              className="relative overflow-hidden rounded-[var(--radius-card)] border border-white/[0.06] bg-[hsl(233,56%,11%,0.45)] p-6 backdrop-blur-md"
            >
              <span
                aria-hidden
                className="absolute right-4 top-4 text-[5rem] font-bold leading-none text-white/[0.04] font-[var(--font-heading)]"
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              <div className="relative">
                <div className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-[var(--radius-control)] border border-primary/30 bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <p className="text-overline text-muted-foreground mb-2">{eyebrow}</p>
                <h3 className="text-heading text-lg font-semibold text-foreground">
                  {title}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">{description}</p>
              </div>
            </div>
          ))}
        </div>
      </Container>
    </Section>
  );
}
