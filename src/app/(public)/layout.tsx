/** Public layout — catalog, quiz, book, proposal, partner public surfaces */
import Link from "next/link";
import { ArrowUpRight, Mail } from "lucide-react";

import { BrandLockup } from "@/components/ui/brand-mark";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/section";
import { PublicMobileMenu } from "@/components/public/PublicMobileMenu";
import { PartnerAttributionBanner } from "@/components/public/PartnerAttributionBanner";

const PRIMARY_LINKS = [
  { label: "Catalog", href: "/catalog" },
  { label: "Case Studies", href: "/catalog/case-studies" },
  { label: "Find Your Match", href: "/quiz" },
  { label: "Book Now", href: "/book" },
  { label: "Get a Proposal", href: "/proposal" },
];

const FOOTER_GROUPS = [
  {
    heading: "Platform",
    links: [
      { label: "Catalog", href: "/catalog" },
      { label: "Case Studies", href: "/catalog/case-studies" },
      { label: "Find Your Match", href: "/quiz" },
      { label: "How It Works", href: "/how-it-works" },
    ],
  },
  {
    heading: "Order",
    links: [
      { label: "Book Now", href: "/book" },
      { label: "Get a Proposal", href: "/proposal" },
      { label: "Become a Partner", href: "/partners/join" },
    ],
  },
  {
    heading: "Company",
    links: [
      { label: "Sign in", href: "/login" },
      { label: "Terms", href: "/terms" },
      { label: "Privacy", href: "/privacy" },
    ],
  },
];

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <PartnerAttributionBanner />
      <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-background/70 backdrop-blur-xl">
        <Container className="flex h-16 items-center justify-between">
          <Link
            href="/catalog"
            className="flex items-center gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-md"
          >
            <BrandLockup />
          </Link>
          <nav className="hidden lg:flex items-center gap-1">
            {PRIMARY_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-white/[0.04] hover:text-foreground"
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <Link
              href="/partners/join"
              className="hidden md:inline-flex text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Become a partner
            </Link>
            <Button asChild variant="glass" size="sm" className="hidden md:inline-flex">
              <Link href="/login">Sign in</Link>
            </Button>
            <Button asChild variant="brand" size="sm" className="hidden md:inline-flex">
              <Link href="/quiz">
                Find your fit
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
            <PublicMobileMenu links={PRIMARY_LINKS} />
          </div>
        </Container>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-white/[0.06] bg-[hsl(233,66%,5%)]">
        <Container className="py-16">
          <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
            <div>
              <BrandLockup size="md" tagline="ACTIVATIONS · DELIVERY · INTELLIGENCE" />
              <p className="mt-4 max-w-sm text-sm text-muted-foreground">
                Bright.Blue interactive activations &mdash; from booking and
                delivery to live telemetry and proof of performance.
              </p>
              <a
                href="mailto:hello@brightblue.com"
                className="mt-6 inline-flex items-center gap-2 text-sm text-foreground hover:text-primary transition-colors"
              >
                <Mail className="h-4 w-4" /> hello@brightblue.com
              </a>
            </div>
            {FOOTER_GROUPS.map((group) => (
              <div key={group.heading}>
                <p className="text-overline text-muted-foreground mb-3">
                  {group.heading}
                </p>
                <ul className="space-y-2">
                  {group.links.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="text-sm text-foreground/80 hover:text-foreground transition-colors"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="mt-12 flex flex-col items-start justify-between gap-4 border-t border-white/[0.06] pt-6 md:flex-row md:items-center">
            <p className="text-xs text-muted-foreground">
              © {new Date().getFullYear()} Bright.Blue Events. All rights reserved.
            </p>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <Link href="/terms" className="hover:text-foreground transition-colors">Terms</Link>
              <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
              <Link href="/partners/join" className="hover:text-foreground transition-colors">Partners</Link>
            </div>
          </div>
        </Container>
      </footer>
    </div>
  );
}
