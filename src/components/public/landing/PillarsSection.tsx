/**
 * Homepage pillars — the three jobs one activation does on the floor.
 * Mirrors the "Own Every Room" pillars from bright.blue/events.
 */
import Image from "next/image";

import { Container, Section } from "@/components/ui/section";

const PILLARS = [
  {
    icon: "/brand-icons/Showoff.svg",
    title: "Draw the Crowd",
    description:
      "Branded, animated, tap-to-play moments that stop people mid-stride and pull a queue around your stand.",
  },
  {
    icon: "/brand-icons/Gift.svg",
    title: "Sample & Reward",
    description:
      "Hand out drinks, snacks, beauty, merch, or prizes on the spot — ideal for launches, promos, and giveaways.",
  },
  {
    icon: "/brand-icons/Leads.svg",
    title: "Capture the Data",
    description:
      "Every play runs through a GDPR-compliant form, so each interaction becomes clean, structured first-party data.",
  },
];

export function PillarsSection() {
  return (
    <Section className="border-t border-border/60">
      <Container>
        <div className="mx-auto max-w-2xl text-center mb-14">
          <p className="text-overline text-brand-cyan mb-3">
            Own Every Room
          </p>
          <h2 className="text-display-grotesk text-4xl text-foreground md:text-5xl text-balance">
            One Machine, Three Jobs Done at Once
          </h2>
          <p className="mt-4 text-muted-foreground leading-relaxed">
            Drop a fully automated activation into any exhibition, festival,
            retail space, or brand event — and watch it earn its place on the
            floor.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {PILLARS.map((p, i) => (
            <div
              key={p.title}
              className="group relative rounded-[var(--radius-card)] border border-border bg-card p-8 transition-colors hover:border-brand-cyan/30"
            >
              <span className="absolute right-6 top-6 text-sm font-semibold tabular-nums text-muted-foreground/40">
                0{i + 1}
              </span>
              <div className="mb-5 flex size-14 items-center justify-center rounded-[var(--radius-control)] bg-primary/10 ring-1 ring-primary/20">
                <Image
                  src={p.icon}
                  alt=""
                  width={40}
                  height={40}
                  aria-hidden
                  unoptimized
                  className="h-8 w-8"
                />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {p.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {p.description}
              </p>
            </div>
          ))}
        </div>
      </Container>
    </Section>
  );
}
