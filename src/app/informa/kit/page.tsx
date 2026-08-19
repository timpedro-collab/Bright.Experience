/**
 * The Informa seller's kit — everything a sponsorship rep with zero
 * Bright.Blue context needs to sell a placement the same day and hand the
 * deal straight to delivery: script, qualifying questions, an interactive
 * placement calculator, a paste-ready prospectus listing, objection
 * handling, proof photography, the delivery timeline, and a deal brief
 * builder that sends Bright.Blue everything needed to deliver.
 *
 * Same unlisted, buyer-safe posture as the partnership deck one level up.
 */
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";

import { AdNetworkMediaKit } from "@/components/informa/AdNetworkMediaKit";
import { DealBriefBuilder } from "@/components/informa/DealBriefBuilder";
import { InventoryListing } from "@/components/informa/InventoryListing";
import { KitCatalog } from "@/components/informa/KitCatalog";
import {
  DeliveryTimeline,
  KitGallery,
  SiteRequirements,
} from "@/components/informa/SellerKitDelivery";
import {
  DealFlowSteps,
  KitSection,
  ObjectionCards,
  QualifyingQuestions,
  RepScript,
  SponsorGets,
} from "@/components/informa/SellerKitSections";
import { KIT_BRIEF_EMAIL } from "@/lib/informa/content";

export const metadata: Metadata = {
  title: { absolute: "Seller's Kit — Bright.Blue for Informa Reps" },
  description:
    "The whole toolkit for selling a Bright.Blue placement: the 60-second script, rate card, reach calculator, objection answers and deal brief.",
  robots: { index: false, follow: false },
  openGraph: {
    title: "Seller's Kit — Bright.Blue for Informa Reps",
    description:
      "The whole toolkit for selling a Bright.Blue placement: the 60-second script, rate card, reach calculator, objection answers and deal brief.",
    images: [{ url: "/pitch/photos/pepsi-midplay-crowd.jpg", width: 2400, height: 1600 }],
    type: "website",
  },
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
            href="/informa"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4" aria-hidden />
            Back to the deck
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
            This page is the whole toolkit, from first pitch to a closed deal
            handed straight to delivery.
          </p>
        </div>

        <div className="mt-14 space-y-0">
          <KitSection overline="Say this" title="The 60 second pitch">
            <RepScript />
          </KitSection>

          <KitSection overline="Ask this" title="Three questions that qualify a sponsor">
            <QualifyingQuestions />
          </KitSection>

          <KitCatalog />

          <div id="media-kit">
            <KitSection
              overline="Sell the screens"
              title="The Screen Ad Network, as a media buy"
            >
              <AdNetworkMediaKit />
            </KitSection>
          </div>

          <KitSection overline="Promise this" title="What the sponsor gets">
            <SponsorGets />
            <div className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[var(--color-bb-cobalt)]/50 bg-[var(--color-bb-cobalt)]/10 p-6">
              <div>
                <h3 className="font-semibold">Show them the report before they sign</h3>
                <p className="mt-1 max-w-xl text-sm leading-relaxed text-muted-foreground">
                  A sample proof-of-performance report with illustrative data:
                  the artefact that wins the renewal conversation, viewable now.
                </p>
              </div>
              <Link
                href="/informa/report"
                className="inline-flex items-center gap-2 rounded-lg border border-border/70 px-4 py-2 text-sm font-medium transition-colors hover:border-[var(--color-bb-cyan)] hover:text-[var(--color-bb-cyan)]"
              >
                Open the sample report
                <ArrowRight className="size-4" aria-hidden />
              </Link>
            </div>
          </KitSection>

          <KitSection
            overline="Paste this"
            title="A ready-made line for your prospectus"
          >
            <InventoryListing />
          </KitSection>

          <KitSection overline="Expect these" title="Objections, answered">
            <ObjectionCards />
          </KitSection>

          <KitSection overline="Proof" title="On show floors already">
            <KitGallery />
          </KitSection>

          <KitSection
            overline="After the signature"
            title="Delivery is our job, start to finish"
          >
            <DeliveryTimeline />
          </KitSection>

          <KitSection
            overline="What the show provides"
            title="A square meter and a socket"
          >
            <SiteRequirements />
          </KitSection>

          <KitSection overline="Protect the deal" title="Once a sponsor bites">
            <DealFlowSteps />
          </KitSection>

          <KitSection
            overline="Close it"
            title="Send the deal brief, and delivery starts"
          >
            <DealBriefBuilder />
          </KitSection>
        </div>

        <footer className="mt-4 space-y-2 border-t border-border/60 py-10 text-sm text-muted-foreground">
          <p>
            Bright.Blue handles build, wrap, freight, install, on-site ops,
            teardown and reporting. Your team sells the line item.
          </p>
          <p>
            Questions mid-deal? Write to{" "}
            <a
              href={`mailto:${KIT_BRIEF_EMAIL}`}
              className="text-foreground underline underline-offset-4 transition-colors hover:text-[var(--color-bb-cyan)]"
            >
              {KIT_BRIEF_EMAIL}
            </a>{" "}
            and you will hear back within one working day.
          </p>
        </footer>
      </div>
    </div>
  );
}
