/**
 * NetworkSection — the network story on the homepage: one platform connecting
 * brands, venues, and organizers, with a door for each role. The venue and
 * organizer sides of the business were previously invisible on the public
 * site (docs/19 §gap-1); this section is their front door.
 */
import Link from "next/link";
import { ArrowRight, Building2, Megaphone, Ticket } from "lucide-react";

import { Container, Section } from "@/components/ui/section";

const DOORS = [
  {
    icon: Megaphone,
    role: "Brands",
    claim: "Own the room, and prove it.",
    body: "A branded machine that pulls the crowd, captures opted-in leads, and reports like a media channel.",
    ctaLabel: "See activation tiers",
    href: "/pricing",
  },
  {
    icon: Building2,
    role: "Venues",
    claim: "Turn quiet days into revenue.",
    body: "Host a machine on rev-share or guarantee terms. We run everything; your portal shows what it earns.",
    ctaLabel: "What your venue could earn",
    href: "/for-venues",
  },
  {
    icon: Ticket,
    role: "Organizers",
    claim: "Prospectus inventory that sells itself.",
    body: "Resell measured activations to your sponsors at your price. We fulfil; you keep the margin and the relationship.",
    ctaLabel: "How organizers sell with us",
    href: "/for-organizers",
  },
];

export function NetworkSection() {
  return (
    <Section className="border-t border-border/60">
      <Container>
        <div className="mx-auto max-w-3xl text-center mb-14">
          <p className="text-overline text-brand-cyan mb-3">
            One connected market
          </p>
          <h2 className="text-display-grotesk text-4xl text-foreground md:text-5xl text-balance">
            One machine. Three businesses better off.
          </h2>
          <p className="mt-4 text-muted-foreground leading-relaxed">
            Every activation connects a brand that wants attention, a floor
            that has it, and an organizer who sells it — on one platform, with
            everyone looking at the same live numbers. That&apos;s the part
            nobody else has built.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {DOORS.map((door) => (
            <Link
              key={door.role}
              href={door.href}
              className="group relative flex flex-col rounded-[var(--radius-card)] border border-border bg-card p-8 transition-colors hover:border-brand-cyan/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <div className="mb-5 flex size-12 items-center justify-center rounded-[var(--radius-control)] bg-primary/10 ring-1 ring-primary/20">
                <door.icon
                  className="h-5 w-5 text-primary"
                  aria-hidden
                />
              </div>
              <p className="text-overline text-muted-foreground">
                For {door.role}
              </p>
              <h3 className="mt-2 text-lg font-semibold text-foreground">
                {door.claim}
              </h3>
              <p className="mt-2 flex-1 text-sm text-muted-foreground leading-relaxed">
                {door.body}
              </p>
              <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-foreground">
                {door.ctaLabel}
                <ArrowRight
                  className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                  aria-hidden
                />
              </span>
            </Link>
          ))}
        </div>
      </Container>
    </Section>
  );
}
