/**
 * Homepage platform section — the turnkey capability tiles, the platform
 * chips strip (mirrored from bright.blue/events), and the Bright.Blue Cloud
 * live band. Sits below the proof section: features after evidence.
 */
import Image from "next/image";

import { Container, Section } from "@/components/ui/section";
import { Reveal } from "@/components/ui/motion";
import { RidgeArtwork } from "@/components/brand";
import { LiveShowFloorStats } from "@/components/public/LiveShowFloorStats";
import { PortalPreview } from "@/components/public/landing/PortalPreview";

const PLATFORM_CAPABILITIES = [
  {
    icon: "/brand-icons/Custom-Content.svg",
    title: "Custom Content",
    description: "Games, quizzes, surveys, and brand storytelling, designed around each event.",
  },
  {
    icon: "/brand-icons/Dynamic-Delivery.svg",
    title: "Dynamic Delivery",
    description: "Swap in videos, sponsor creative, or campaign messaging whenever you need to.",
  },
  {
    icon: "/brand-icons/Instant-Gratification.svg",
    title: "Instant Rewards",
    description: "Samples and prizes drop the moment someone plays — every dispense tracked.",
  },
  {
    icon: "/brand-icons/Lead-Collection-Tools.svg",
    title: "Lead Collection",
    description: "Names, emails, preferences, and survey answers gathered through one smooth flow.",
  },
  {
    icon: "/brand-icons/Engagement-Data.svg",
    title: "Live Engagement Data",
    description: "See interactions, conversions, and product movement as they happen.",
  },
  {
    icon: "/brand-icons/End-to-End-Support.svg",
    title: "End-to-End Support",
    description: "Setup, creative build, product loading, delivery, and close-out reporting — all handled.",
  },
];

/** Deeper platform capabilities, shown as a compact chip strip. */
const PLATFORM_CHIPS = [
  "Payments Platform",
  "Ad Platform",
  "Age Verification",
  "Advanced Telemetry",
  "Analytics",
];

export function PlatformSection() {
  return (
    <Section className="border-t border-border/60">
      <Container>
        <div className="mx-auto max-w-2xl text-center mb-14">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground mb-3">
            The Turnkey Platform
          </p>
          <h2 className="text-display-serif text-4xl text-foreground md:text-5xl text-balance">
            Everything Behind the Activation, Covered
          </h2>
          <p className="mt-4 text-muted-foreground leading-relaxed">
            From the first idea to the post-event report, the work is done for
            you — so the activation simply shows up and performs.
          </p>
        </div>

        {/* The portal itself is the best sales asset we have (H7): show the
            live dashboard a client watches on event day, next to what it
            means for them. */}
        <div className="mb-16 grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <Reveal>
            <p className="text-overline text-[var(--color-bb-cobalt)] mb-3">
              Your event, live
            </p>
            <h3 className="text-heading text-2xl font-bold text-foreground md:text-3xl text-balance">
              Watch the queue build, play by play
            </h3>
            <ul className="mt-6 space-y-4 text-muted-foreground">
              <li className="flex gap-3">
                <span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-full bg-[var(--color-bb-cobalt)]" />
                <span>
                  <span className="font-medium text-foreground">Live counters</span>{" "}
                  — plays, leads and prize drops tick up in real time while
                  your activation runs.
                </span>
              </li>
              <li className="flex gap-3">
                <span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-full bg-[var(--color-bb-cobalt)]" />
                <span>
                  <span className="font-medium text-foreground">A feed of every interaction</span>{" "}
                  — each play, lead and dispense as it happens, machine by
                  machine.
                </span>
              </li>
              <li className="flex gap-3">
                <span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-full bg-[var(--color-bb-cobalt)]" />
                <span>
                  <span className="font-medium text-foreground">A board-ready report</span>{" "}
                  — the full story of the day, in your inbox within 24 hours.
                </span>
              </li>
            </ul>
          </Reveal>
          <Reveal delay={0.1} y={28}>
            <PortalPreview />
          </Reveal>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {PLATFORM_CAPABILITIES.map((c) => (
            <div
              key={c.title}
              className="flex gap-4 rounded-2xl border border-border bg-muted/40 p-7"
            >
              <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-background/60 ring-1 ring-border">
                <Image
                  src={c.icon}
                  alt=""
                  width={32}
                  height={32}
                  aria-hidden
                  unoptimized
                  className="h-7 w-7"
                />
              </div>
              <div>
                <h3 className="text-base font-semibold text-foreground mb-1.5">
                  {c.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {c.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 flex items-center justify-center gap-2 flex-wrap">
          {PLATFORM_CHIPS.map((chip) => (
            <span
              key={chip}
              className="rounded-full border border-border bg-muted/40 px-4 py-1.5 text-xs font-medium text-muted-foreground"
            >
              {chip}
            </span>
          ))}
        </div>

        <div className="relative mt-12 overflow-hidden rounded-2xl border border-white/8 bg-gradient-to-br from-[var(--color-bb-deep-ink)] via-[#0d1147] to-[var(--color-bb-cobalt)] p-10 md:p-14">
          <RidgeArtwork
            seed="landing::platform"
            lines={20}
            amplitude={60}
            className="text-[hsl(230,93%,53%)] opacity-40"
          />
          <div className="relative text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-bb-cyan)] mb-3">
              Bright.Blue Cloud · Live from the Show Floor
            </p>
            <LiveShowFloorStats />
          </div>
        </div>
      </Container>
    </Section>
  );
}
