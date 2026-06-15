import Link from "next/link";
import {
  ArrowRight,
  Zap,
  BarChart3,
  Shield,
  Sparkles,
  Play,
  Users,
} from "lucide-react";

import { Container, Section } from "@/components/ui/section";
import { Button } from "@/components/ui/button";
import { BrandLockup } from "@/components/ui/brand-mark";
import { RidgeArtwork } from "@/components/brand";
import { LogosStrip } from "@/components/catalog/LogosStrip";

const CAPABILITIES = [
  {
    icon: Sparkles,
    title: "Browse the catalog",
    description:
      "Interactive machines, games, and packages — explore what's possible for your next activation.",
    href: "/catalog",
    cta: "Explore catalog",
  },
  {
    icon: Play,
    title: "See it in action",
    description:
      "Real activations from Costa Coffee, Coca-Cola, Samsung, and more — with photos, results, and the full story.",
    href: "/catalog/case-studies",
    cta: "View case studies",
  },
  {
    icon: Zap,
    title: "Find your match",
    description:
      "Answer a few questions and we'll recommend the perfect machine, game, and package for your event.",
    href: "/quiz",
    cta: "Take the quiz",
  },
];

const PLATFORM_FEATURES = [
  {
    icon: BarChart3,
    title: "Live telemetry",
    description: "Real-time plays, leads, and interactions streaming from the show floor.",
  },
  {
    icon: Shield,
    title: "GDPR-compliant leads",
    description: "Clean, structured lead data ready for your CRM — collected with consent.",
  },
  {
    icon: Users,
    title: "Turnkey delivery",
    description: "Creative, logistics, QA, and reporting — managed end-to-end by Bright.Blue.",
  },
];

export function PublicLanding() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="sticky top-0 z-50 bg-background/85 backdrop-blur-md border-b border-border/40">
        <Container className="flex h-16 items-center justify-between gap-6">
          <Link href="/" className="flex items-center gap-2.5">
            <BrandLockup />
          </Link>
          <nav className="hidden lg:flex items-center gap-1">
            <NavLink href="/catalog">Catalog</NavLink>
            <NavLink href="/catalog/case-studies">Case Studies</NavLink>
            <NavLink href="/quiz">Find Your Match</NavLink>
            <NavLink href="/proposal">Get a Quote</NavLink>
          </nav>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Sign in
            </Link>
            <Button variant="brand" size="sm" asChild>
              <Link href="/catalog">
                Explore <ArrowRight className="size-3.5" />
              </Link>
            </Button>
          </div>
        </Container>
      </header>

      <main className="flex-1">
        <HeroSection />
        <LogosStrip
          overline="Trusted by leading brands"
          logos={[
            { name: "Costa Coffee" },
            { name: "Coca-Cola" },
            { name: "Samsung" },
            { name: "Red Bull" },
            { name: "Porsche" },
            { name: "Pepsi" },
          ]}
        />
        <CapabilitiesSection />
        <PlatformSection />
        <CtaSection />
      </main>

      <Footer />
    </div>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="rounded-sm px-3 py-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground transition-colors hover:bg-accent/40 hover:text-foreground"
    >
      {children}
    </Link>
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
            The post-sale delivery portal
          </p>
          <h1 className="text-[clamp(2.5rem,7vw,5.5rem)] font-bold leading-[1.02] text-foreground text-balance">
            Your activation,{" "}
            <span className="bg-gradient-to-r from-[var(--color-bb-cobalt)] to-[var(--color-bb-cyan)] bg-clip-text text-transparent">
              beautifully managed.
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground md:text-xl leading-relaxed text-balance">
            From briefing and creative build through to live telemetry and
            proof-of-performance reporting — everything in one premium workspace.
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

function CapabilitiesSection() {
  return (
    <Section className="border-t border-white/[0.06]">
      <Container>
        <div className="mx-auto max-w-2xl text-center mb-14">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground mb-3">
            Get started
          </p>
          <h2 className="text-3xl font-bold text-foreground md:text-4xl">
            Three ways in.
          </h2>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {CAPABILITIES.map((cap) => {
            const Icon = cap.icon;
            return (
              <Link
                key={cap.title}
                href={cap.href}
                className="group relative overflow-hidden rounded-2xl border border-white/8 bg-white/[0.02] p-8 transition-all hover:border-white/15 hover:bg-white/[0.04]"
              >
                <div className="flex size-12 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] mb-5">
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
    <Section className="border-t border-white/[0.06]">
      <Container>
        <div className="grid gap-12 md:grid-cols-2 md:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground mb-3">
              The platform
            </p>
            <h2 className="text-3xl font-bold text-foreground md:text-4xl">
              More than a booking tool.
            </h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              Bright.Experience is the delivery platform that powers every
              Bright.Blue activation. Your customers get a premium workspace.
              Your team gets operational clarity. Everyone gets live data.
            </p>
            <div className="mt-8 space-y-6">
              {PLATFORM_FEATURES.map((f) => {
                const Icon = f.icon;
                return (
                  <div key={f.title} className="flex gap-4">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-white/8 bg-white/[0.03]">
                      <Icon className="size-4 text-[var(--color-bb-cyan)]" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">{f.title}</h3>
                      <p className="text-sm text-muted-foreground">{f.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="relative aspect-square overflow-hidden rounded-2xl border border-white/8 bg-gradient-to-br from-[var(--color-bb-deep-ink)] via-[#0d1147] to-[var(--color-bb-cobalt)]">
            <RidgeArtwork
              seed="landing::platform"
              lines={20}
              amplitude={60}
              className="text-[hsl(230,93%,53%)] opacity-40"
            />
            <div className="absolute inset-0 flex flex-col items-center justify-center p-10 text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-bb-cyan)] mb-3">
                Live from the show floor
              </p>
              <p className="text-5xl font-bold text-white tabular-nums">1,247</p>
              <p className="text-sm text-white/50 mt-1">leads captured today</p>
              <div className="mt-8 grid grid-cols-3 gap-6 text-center">
                <div>
                  <p className="text-2xl font-bold text-white tabular-nums">3,891</p>
                  <p className="text-[10px] uppercase tracking-widest text-white/40">plays</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-white tabular-nums">42s</p>
                  <p className="text-[10px] uppercase tracking-widest text-white/40">avg dwell</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-white tabular-nums">94%</p>
                  <p className="text-[10px] uppercase tracking-widest text-white/40">opt-in</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </Section>
  );
}

function CtaSection() {
  return (
    <Section className="border-t border-white/[0.06]">
      <Container size="md">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-foreground md:text-4xl">
            Ready to see what&apos;s possible?
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

function Footer() {
  const LINKS = [
    { label: "Catalog", href: "/catalog" },
    { label: "Case Studies", href: "/catalog/case-studies" },
    { label: "Quiz", href: "/quiz" },
    { label: "Get a Quote", href: "/proposal" },
    { label: "Partners", href: "/partners/join" },
    { label: "Sign in", href: "/login" },
  ];

  return (
    <footer className="border-t border-border/40 bg-[hsl(233,66%,5%)]">
      <Container className="py-12">
        <div className="flex flex-col items-center gap-6 text-center">
          <BrandLockup size="md" />
          <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            {LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span>© {new Date().getFullYear()} Bright.Blue Events</span>
            <Link href="/terms" className="hover:text-foreground transition-colors">Terms</Link>
            <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
            <a
              href="https://bright.blue"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors"
            >
              bright.blue
            </a>
          </div>
        </div>
      </Container>
    </footer>
  );
}
