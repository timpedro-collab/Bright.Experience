/**
 * Privacy Policy page — GDPR-compliant template.
 *
 * Uses [Company Name] and [Date] placeholders for final legal review.
 * Pass `approved={true}` to LegalShell once counsel signs off.
 */
import type { Metadata } from "next";
import { LegalShell } from "@/components/public/LegalShell";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How Bright.Blue Events collects, processes, and protects your data.",
  openGraph: {
    title: "Privacy Policy — Bright.Experience",
    description:
      "How Bright.Blue Events collects, processes, and protects your data.",
  },
};

const LAST_UPDATED = "2026-05-01";

export default function PrivacyPage() {
  return (
    <LegalShell
      eyebrow="Legal"
      title="Privacy Policy"
      lastUpdatedIso={LAST_UPDATED}
      approved
    >
      <Block heading="1. Data Controller">
        <p>
          [Company Name] (Bright.Blue Events Ltd), registered in England &amp;
          Wales, is the data controller for personal data collected through
          the Bright.Experience platform. Our registered address is [Address].
          You can contact our data protection lead at{" "}
          <a
            className="text-primary underline underline-offset-4"
            href="mailto:hello@brightblue.co.uk"
          >
            hello@brightblue.co.uk
          </a>
          .
        </p>
      </Block>
      <Block heading="2. What We Collect">
        <ul className="list-disc pl-5 space-y-1">
          <li>
            <strong>Account data:</strong> name, email, company, phone number
            when you register or request a quote.
          </li>
          <li>
            <strong>Booking data:</strong> event details, dates, venue, package
            selections, and billing details for invoicing.
          </li>
          <li>
            <strong>Lead data:</strong> contact details captured at activations
            on behalf of the event sponsor.
          </li>
          <li>
            <strong>Usage data:</strong> pages visited, feature usage, browser
            type, IP address, device information.
          </li>
          <li>
            <strong>Telemetry data:</strong> anonymised machine interaction
            counts, dwell times, and engagement metrics.
          </li>
        </ul>
      </Block>
      <Block heading="3. Legal Basis for Processing">
        <ul className="list-disc pl-5 space-y-1">
          <li>
            <strong>Contract:</strong> processing necessary to deliver your
            booking and provide the Service.
          </li>
          <li>
            <strong>Legitimate interest:</strong> platform analytics, fraud
            prevention, and service improvement.
          </li>
          <li>
            <strong>Consent:</strong> marketing communications (opt-in only).
          </li>
          <li>
            <strong>Legal obligation:</strong> tax records, regulatory
            compliance.
          </li>
        </ul>
      </Block>
      <Block heading="4. How We Use Your Data">
        <p>
          We use your data to deliver activations, generate post-event reports,
          send transactional communications (booking confirmations, asset
          deadlines, stage updates), improve the platform, and produce
          anonymised benchmarks. We do not sell your personal data to third
          parties.
        </p>
      </Block>
      <Block heading="5. Sharing &amp; Transfers">
        <p>
          We share data only with: email delivery (Resend), hosting
          infrastructure (Vercel, Supabase), and — where you have booked via a
          partner — your referring partner for commission purposes. All processors are bound by data processing agreements.
          Data is stored in the EU/UK; any onward transfer to a third country
          relies on Standard Contractual Clauses or an adequacy decision.
        </p>
      </Block>
      <Block heading="6. Retention">
        <p>
          Account data is retained for the life of your account plus 12 months
          after deletion. Booking and financial records are retained for 7
          years per HMRC requirements. Lead data is passed to the event sponsor
          and deleted from our systems within 90 days of event completion.
          Anonymised telemetry is retained indefinitely for benchmarking.
        </p>
      </Block>
      <Block heading="7. Your Rights">
        <p>Under UK GDPR you have the right to:</p>
        <ul className="list-disc pl-5 space-y-1 mt-2">
          <li>Access the personal data we hold about you.</li>
          <li>Rectify inaccurate or incomplete data.</li>
          <li>Erase your data (&ldquo;right to be forgotten&rdquo;).</li>
          <li>Restrict or object to processing.</li>
          <li>Data portability in a machine-readable format.</li>
          <li>Withdraw consent at any time (where consent is the basis).</li>
          <li>Lodge a complaint with the ICO (ico.org.uk).</li>
        </ul>
        <p className="mt-2">
          To exercise any right, email{" "}
          <a
            className="text-primary underline underline-offset-4"
            href="mailto:hello@brightblue.co.uk"
          >
            hello@brightblue.co.uk
          </a>
          . We will respond within 30 days.
        </p>
      </Block>
      <Block heading="8. Cookies">
        <p>
          We use strictly necessary first-party cookies to maintain your
          session and preferences. We use privacy-respecting analytics
          (no third-party advertising cookies). You can manage cookie
          preferences via your browser settings. A detailed cookie schedule
          is available on request.
        </p>
      </Block>
      <Block heading="9. Contact">
        <p>
          Data Protection Lead: [Company Name], Bright.Blue Events Ltd.
          Email:{" "}
          <a
            className="text-primary underline underline-offset-4"
            href="mailto:hello@brightblue.co.uk"
          >
            hello@brightblue.co.uk
          </a>
          .
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          Last reviewed: [Date] — [Company Name], registered in England &amp;
          Wales.
        </p>
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
      <h2 className="text-xl font-semibold text-foreground">{heading}</h2>
      <div className="mt-2 text-sm leading-relaxed text-muted-foreground">
        {children}
      </div>
    </section>
  );
}
