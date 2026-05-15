/** Public partner application page — no auth required */
import type { Metadata } from "next";
import { Handshake } from "lucide-react";

import { PartnerOnboardingWizard } from "@/components/partners/PartnerOnboardingWizard";

export const metadata: Metadata = {
  title: "Become a Partner",
  description:
    "Join the Bright.Blue partner programme and earn commission on every referral — whether you're a reseller, agency, or referrer.",
};

export default function PartnerJoinPage() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      <div className="mb-12 text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-[var(--radius-card)] bg-primary/10 border border-primary/20">
          <Handshake size={32} className="text-primary" />
        </div>
        <h1 className="text-heading text-3xl font-bold text-foreground">
          Become a Bright.Blue partner
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
          Join our partner programme and earn commission for every client you
          refer. Whether you&apos;re a referral partner, reseller, or agency — we
          have a model that works for you.
        </p>
      </div>
      <PartnerOnboardingWizard />
    </div>
  );
}
