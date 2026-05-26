/**
 * Privacy policy — placeholder structured copy.
 *
 * Real legal text replaces this entire body when counsel signs off. The
 * shared {@link LegalShell} surfaces a "REPLACE BEFORE LAUNCH" banner
 * until that swap.
 */
import type { Metadata } from "next";
import { LegalShell } from "@/components/public/LegalShell";

export const metadata: Metadata = {
  title: "Privacy policy",
  description:
    "How Bright.Blue Events collects, processes, and protects your data.",
  openGraph: {
    title: "Privacy policy — Bright.Experience",
    description:
      "How Bright.Blue Events collects, processes, and protects your data.",
  },
};

// STUB: replace lastUpdatedIso with the counsel-signed-off date.
const LAST_UPDATED = "2026-04-01";

export default function PrivacyPage() {
  return (
    <LegalShell
      eyebrow="Legal"
      title="Privacy policy"
      lastUpdatedIso={LAST_UPDATED}
    >
      <Block heading="1. Who we are">
        Bright.Blue Events Ltd is the data controller for personal data
        collected through Bright.Experience.
      </Block>
      <Block heading="2. What we collect">
        We collect contact and account details when you create an account,
        request a quote, or submit a lead at an activation. We also collect
        anonymised telemetry data from machines.
      </Block>
      <Block heading="3. How we use your data">
        We use your data to deliver your booking, send transactional
        communications, generate post-event reports, and improve our service.
        We do not sell your data.
      </Block>
      <Block heading="4. Leads captured at events">
        Leads captured at your activation are passed exclusively to you, the
        event sponsor. Bright.Blue does not retain or remarket to those
        individuals.
      </Block>
      <Block heading="5. Cookies & analytics">
        We use first-party cookies to keep you signed in and to measure usage
        of the platform. We do not use third-party advertising cookies.
      </Block>
      <Block heading="6. Your rights">
        You may request access, correction, or deletion of your personal data
        at any time by emailing{" "}
        <a className="text-primary" href="mailto:privacy@brightblue.com">
          privacy@brightblue.com
        </a>
        .
      </Block>
    </LegalShell>
  );
}

function Block({
  heading,
  children,
}: {
  heading: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-8">
      <h2 className="text-heading text-xl font-semibold text-foreground">
        {heading}
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        {children}
      </p>
    </section>
  );
}
