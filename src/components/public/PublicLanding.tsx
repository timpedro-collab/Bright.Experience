import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Zap, Sparkles, Play } from "lucide-react";

import { Container, Section } from "@/components/ui/section";
import { Button } from "@/components/ui/button";
import { RidgeArtwork } from "@/components/brand";
import { LogosStrip } from "@/components/catalog/LogosStrip";
import { PublicSiteChrome } from "@/components/public/PublicSiteChrome";
import { LiveShowFloorStats } from "@/components/public/LiveShowFloorStats";
import { CLIENT_LOGOS } from "@/lib/marketing/client-logos";

/** The three jobs one activation does on the floor. */
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

/** What we handle end-to-end so the activation just works. */
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

const CAPABILITIES = [
  {
    icon: Sparkles,
    title: "Browse the Catalog",
    description:
      "Explore interactive machines, games, and packages, and picture what's possible for your next activation.",
    href: "/catalog",
    cta: "Explore the catalog",
  },
  {
    icon: Play,
    title: "See It in Action",
    description:
      "Real activations with photos, results, and the full story behind the numbers.",
    href: "/catalog/case-studies",
    cta: "View case studies",
  },
  {
    icon: Zap,
    title: "Find Your Match",
    description:
      "Answer a few quick questions and get a tailored machine, game, and package recommendation.",
    href: "/quiz",
    cta: "Take the quiz",
  },
];

export function PublicLanding() {
  return (
    <PublicSiteChrome>
      <HeroSection />
      <LogosStrip overline="Trusted by Leading Brands" logos={CLIENT_LOGOS} />
      <PillarsSection />
      <CapabilitiesSection />
      <PlatformSection />
      <CtaSection />
    </PublicSiteChrome>
  );
}

function HeroSection() {
  return (
    <section className="relative isolate overflow-hidden">
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 ridge-color-cobalt"
        style={{ height: "clamp(500px, 70vh, 800px)" }}
      >
        <RidgeArtwork
          seed="landing::home"
          lines={40}
          amplitude={120}
          className="text-[hsl(230,93%,53%)]"
        />
        <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-background to-transparent" />
      </div>

      <Container className="relative py-28 md:py-40">
        <div className="mx-auto max-w-4xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-bb-cyan)] mb-5">
            Make your moment count
          </p>
          <h1 className="text-[clamp(2.5rem,7vw,5.5rem)] font-bold leading-[1.02] text-foreground text-balance">
            Your Next Activation,{" "}
            <span className="bg-gradient-to-r from-[var(--color-bb-cobalt)] to-[var(--color-bb-cyan)] bg-clip-text text-transparent">
              Beautifully Delivered
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground md:text-xl leading-relaxed text-balance">
            Browse crowd-stopping machines and games, find your match in minutes,
            and track every detail through to live results — all in one
            workspace built for the people running the event.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4 flex-wrap">
            <Button size="lg" variant="brand" asChild>
              <Link href="/catalog">
                Explore the catalog <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button size="lg" variant="glass" asChild>
              <Link href="/login">Sign in to your portal</Link>
            </Button>
          </div>
        </div>
      </Container>
    </section>
  );
}

function PillarsSection() {
  return (
    <Section className="border-t border-border/60">
      <Container>
        <div className="mx-auto max-w-2xl text-center mb-14">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground mb-3">
            On the Show Floor
          </p>
          <h2 className="text-3xl font-bold text-foreground md:text-4xl text-balance">
            One Machine, Three Jobs Done at Once
          </h2>
          <p className="mt-4 text-muted-foreground leading-relaxed">
            Drop a fully automated activation into any exhibition, conference, or
            brand event — and watch it earn its place on the floor.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {PILLARS.map((p, i) => (
            <div
              key={p.title}
              className="group relative rounded-2xl border border-border bg-muted/40 p-8 transition-colors hover:border-[var(--color-bb-cyan)]/30"
            >
              <span className="absolute right-6 top-6 text-sm font-semibold tabular-nums text-muted-foreground/40">
                0{i + 1}
              </span>
              <div className="mb-5 flex size-14 items-center justify-center rounded-xl bg-[var(--color-bb-cobalt)]/10 ring-1 ring-[var(--color-bb-cobalt)]/20">
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

function CapabilitiesSection() {
  return (
    <Section className="border-t border-border/60">
      <Container>
        <div className="mx-auto max-w-2xl text-center mb-14">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground mb-3">
            Get Started
          </p>
          <h2 className="text-3xl font-bold text-foreground md:text-4xl">
            Three Ways In
          </h2>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {CAPABILITIES.map((cap) => {
            const Icon = cap.icon;
            return (
              <Link
                key={cap.title}
                href={cap.href}
                className="group relative overflow-hidden rounded-2xl border border-border bg-muted/40 p-8 transition-all hover:border-white/15 hover:bg-accent"
              >
                <div className="flex size-12 items-center justify-center rounded-xl border border-border bg-muted/40 mb-5">
                  <Icon className="size-5 text-[var(--color-bb-cyan)]" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {cap.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                  {cap.description}
                </p>
                <span className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--color-bb-cobalt)] group-hover:gap-2.5 transition-all">
                  {cap.cta} <ArrowRight className="size-3.5" />
                </span>
              </Link>
            );
          })}
        </div>
      </Container>
    </Section>
  );
}

function PlatformSection() {
  return (
    <Section className="border-t border-border/60">
      <Container>
        <div className="mx-auto max-w-2xl text-center mb-14">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground mb-3">
            What We Handle
          </p>
          <h2 className="text-3xl font-bold text-foreground md:text-4xl text-balance">
            Everything Behind the Activation, Covered
          </h2>
          <p className="mt-4 text-muted-foreground leading-relaxed">
            From the first idea to the post-event report, the work is done for
            you — so the activation simply shows up and performs.
          </p>
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

        <div className="relative mt-12 overflow-hidden rounded-2xl border border-white/8 bg-gradient-to-br from-[var(--color-bb-deep-ink)] via-[#0d1147] to-[var(--color-bb-cobalt)] p-10 md:p-14">
          <RidgeArtwork
            seed="landing::platform"
            lines={20}
            amplitude={60}
            className="text-[hsl(230,93%,53%)] opacity-40"
          />
          <div className="relative text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-bb-cyan)] mb-3">
              Live from the Show Floor
            </p>
            <LiveShowFloorStats />
          </div>
        </div>
      </Container>
    </Section>
  );
}

function CtaSection() {
  return (
    <Section className="border-t border-border/60">
      <Container size="md">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-foreground md:text-4xl">
            Ready to See What&apos;s Possible?
          </h2>
          <p className="mt-3 text-muted-foreground max-w-lg mx-auto">
            Browse the full catalog, take the quiz to find your perfect setup,
            or sign in if you&apos;re already a customer.
          </p>
          <div className="mt-8 flex justify-center gap-3 flex-wrap">
            <Button size="lg" variant="brand" asChild>
              <Link href="/catalog">
                Explore the catalog <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button size="lg" variant="glass" asChild>
              <Link href="/quiz">Take the quiz</Link>
            </Button>
            <Button size="lg" variant="ghost" asChild>
              <Link href="/login">Sign in</Link>
            </Button>
          </div>
        </div>
      </Container>
    </Section>
  );
}

