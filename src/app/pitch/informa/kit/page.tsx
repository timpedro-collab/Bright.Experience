/**
 * The Informa seller's kit — everything a sponsorship rep with zero
 * Bright.Blue context needs to sell a placement the same day: script,
 * qualifying questions, an interactive placement calculator, objection
 * handling, and the deal-protection flow.
 *
 * Same unlisted, buyer-safe posture as the pitch deck one level up.
 */
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { PlacementConfigurator } from "@/components/informa/PlacementConfigurator";
import {
  DealFlowSteps,
  KitSection,
  ObjectionCards,
  QualifyingQuestions,
  RepScript,
  SponsorGets,
} from "@/components/informa/SellerKitSections";

export const metadata: Metadata = {
  title: "Informa seller's kit · Bright.Blue",
  robots: { index: false, follow: false },
};

export default function InformaSellerKitPage() {
  return (
    <div className="theme-dark min-h-dvh bg-background text-foreground">
      <div className="mx-auto max-w-5xl px-6 py-12 sm:px-10">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <Image
            src="/brand/bright-blue-wordmark-light.png"
            alt="Bright.Blue"
            width={140}
            height={37}
            priority
          />
          <Link
            href="/pitch/informa"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4" aria-hidden />
            Back to the pitch
          </Link>
        </header>

        <div className="mt-14 max-w-3xl">
          <p className="text-overline text-[var(--color-bb-cyan)]">
            The Informa seller&apos;s kit
          </p>
          <h1 className="text-display-grotesk mt-3 text-4xl leading-tight sm:text-5xl">
            Sell a Bright.Blue placement in one meeting
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
            One new line for your sponsorship book: a branded interactive
            machine, badge-gated plays, opted-in leads, and a proof report
            within 24 hours of close. Bright.Blue runs everything on site.
            This page is the whole toolkit.
          </p>
        </div>

        <div className="mt-14 space-y-0">
          <KitSection overline="Say this" title="The 60 second pitch">
            <RepScript />
          </KitSection>

          <KitSection overline="Ask this" title="Three questions that qualify a sponsor">
            <QualifyingQuestions />
          </KitSection>

          <KitSection
            overline="Show this"
            title="Price a placement live, in the meeting"
          >
            <PlacementConfigurator />
          </KitSection>

          <KitSection overline="Promise this" title="What the sponsor gets">
            <SponsorGets />
          </KitSection>

          <KitSection overline="Expect these" title="Objections, answered">
            <ObjectionCards />
          </KitSection>

          <KitSection overline="Protect the deal" title="Once a sponsor bites">
            <DealFlowSteps />
          </KitSection>
        </div>

        <footer className="mt-4 border-t border-border/60 py-10 text-sm text-muted-foreground">
          <p>
            Bright.Blue handles build, wrap, freight, install, on-site ops,
            teardown and reporting. Your team sells the line item.
          </p>
        </footer>
      </div>
    </div>
  );
}
