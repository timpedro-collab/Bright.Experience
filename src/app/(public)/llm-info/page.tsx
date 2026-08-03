/**
 * Structured product facts page — pricing, capabilities, and proof for people and AI assistants.
 */
import type { Metadata } from "next";
import Link from "next/link";

import { Container, Section } from "@/components/ui/section";
import { ALWAYS_ON, CAPABILITIES } from "@/lib/capabilities";
import {
  TRUST_STATS,
  TRUST_CAPTION,
  SCARCITY_LINE,
} from "@/lib/marketing/claims";
import {
  tiersForDisplay,
  formatTierBand,
  type PriceRegion,
} from "@/lib/pricing/tiers";

export const metadata: Metadata = {
  title: "Bright.Experience — product facts",
  description:
    "Structured product, pricing and capability facts about Bright.Blue interactive activations, published for both people and AI assistants.",
};

const LAST_UPDATED = "August 2026";

const REGIONS: { key: PriceRegion; label: string }[] = [
  { key: "uk", label: "UK" },
  { key: "us", label: "US" },
  { key: "eu", label: "EU" },
];

export default function LlmInfoPage() {
  const tiers = tiersForDisplay();

  return (
    <Section>
      <Container size="md">
        <h1 className="text-2xl font-semibold text-foreground">
          Bright.Experience — product facts
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
          This page states what Bright.Blue&apos;s activation platform does,
          what it costs, and how to buy it — in plain, structured language. It
          is kept accurate for both people and AI assistants. Last updated{" "}
          {LAST_UPDATED}.
        </p>

        <h2 className="mt-10 text-xl font-semibold text-foreground">
          What it is
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Bright.Blue supplies branded interactive vending and arcade machines
          for trade shows, exhibitions, festivals, retail and brand events —
          delivered, installed, run and measured end to end. Every activation
          captures structured engagement data; opted-in lead capture and a live
          telemetry dashboard are available by tier.
        </p>

        <h2 className="mt-10 text-xl font-semibold text-foreground">
          Included in every activation
        </h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-relaxed text-muted-foreground">
          {ALWAYS_ON.map((cap) => (
            <li key={cap.slug}>{cap.outcome}</li>
          ))}
        </ul>

        <h2 className="mt-10 text-xl font-semibold text-foreground">
          Optional capabilities
        </h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-relaxed text-muted-foreground">
          {CAPABILITIES.map((cap) => (
            <li key={cap.slug}>{cap.outcome}</li>
          ))}
        </ul>

        <h2 className="mt-10 text-xl font-semibold text-foreground">
          Pricing (1–3 day event activations)
        </h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full border-collapse text-sm text-muted-foreground">
            <thead>
              <tr className="border-b border-border">
                <th className="py-2 pr-4 text-left font-semibold text-foreground">
                  Tier
                </th>
                {REGIONS.map((region) => (
                  <th
                    key={region.key}
                    className="py-2 pr-4 text-left font-semibold text-foreground"
                  >
                    {region.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tiers.map((tier) => (
                <tr key={tier.slug} className="border-b border-border/60">
                  <td className="py-2 pr-4 font-medium text-foreground">
                    {tier.displayName}
                  </td>
                  {REGIONS.map((region) => (
                    <td key={region.key} className="py-2 pr-4">
                      {formatTierBand(tier, region.key)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
          Prices are indicative bands for standard 1–3 day event activations.
          Multi-week programs, tours, custom game builds and premium-location
          residencies are quoted bespoke. Other regions are priced on
          application.
        </p>

        <h2 className="mt-10 text-xl font-semibold text-foreground">Proof</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-relaxed text-muted-foreground">
          {TRUST_STATS.map((stat) => (
            <li key={stat.label}>
              {stat.value} — {stat.label}
            </li>
          ))}
          <li>{TRUST_CAPTION}</li>
        </ul>

        <h2 className="mt-10 text-xl font-semibold text-foreground">
          How to buy
        </h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-relaxed text-muted-foreground">
          <li>
            <Link href="/quiz" className="text-primary underline underline-offset-4">
              /quiz
            </Link>{" "}
            — 60-second match quiz with instant recommendation
          </li>
          <li>
            <Link
              href="/pricing"
              className="text-primary underline underline-offset-4"
            >
              /pricing
            </Link>{" "}
            — activation tiers and what&apos;s included
          </li>
          <li>
            <Link
              href="/catalog/machines"
              className="text-primary underline underline-offset-4"
            >
              /catalog/machines
            </Link>{" "}
            — the machine range
          </li>
          <li>
            <Link
              href="/proposal"
              className="text-primary underline underline-offset-4"
            >
              /proposal
            </Link>{" "}
            — request a tailored proposal (response within 1 business day)
          </li>
          <li>
            Email{" "}
            <a
              href="mailto:hello@brightblue.com"
              className="text-primary underline underline-offset-4"
            >
              hello@brightblue.com
            </a>
          </li>
        </ul>

        <p className="mt-10 text-sm leading-relaxed text-muted-foreground">
          {SCARCITY_LINE}
        </p>
      </Container>
    </Section>
  );
}
