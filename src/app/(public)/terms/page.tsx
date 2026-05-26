/**
 * Terms & conditions — placeholder copy.
 *
 * Real legal text replaces this entire body when counsel signs off. The
 * shared {@link LegalShell} surfaces a "REPLACE BEFORE LAUNCH" banner
 * until that swap.
 */
import type { Metadata } from "next";
import { LegalShell } from "@/components/public/LegalShell";

export const metadata: Metadata = {
  title: "Terms & conditions",
  description: "Bright.Experience terms of service and conditions of use.",
  openGraph: {
    title: "Terms & conditions — Bright.Experience",
    description: "Terms of service and conditions of use.",
  },
};

// STUB: replace lastUpdatedIso with the counsel-signed-off date.
const LAST_UPDATED = "2026-04-01";

export default function TermsPage() {
  return (
    <LegalShell
      eyebrow="Legal"
      title="Terms & conditions"
      lastUpdatedIso={LAST_UPDATED}
    >
      <Block heading="1. Acceptance">
        By accessing Bright.Experience or booking a Bright.Blue activation,
        you agree to these terms. If you are booking on behalf of a company,
        you confirm that you have authority to bind that company to these
        terms.
      </Block>
      <Block heading="2. Bookings & quotes">
        Quotes are valid for the period stated on the proposal. Pricing for
        experiential activations may vary by location, footfall, and the
        included media value of the placement. Bookings are confirmed when a
        deposit invoice is paid and the briefing form is submitted.
      </Block>
      <Block heading="3. Cancellations">
        Cancellations made more than 30 days before the event date are
        refundable less an admin fee. Cancellations within 30 days forfeit
        the deposit. Cancellations within 7 days are charged at the full
        booking value.
      </Block>
      <Block heading="4. Asset delivery">
        Customer-provided creative assets must be uploaded by the dates
        agreed in the event brief. Failure to deliver may result in a
        delayed go-live or default creative being used.
      </Block>
      <Block heading="5. Data & reporting">
        All leads captured during your activation are exclusively yours.
        Bright.Blue uses anonymised aggregate metrics for benchmarking and
        recommendation purposes only.
      </Block>
      <Block heading="6. Liability">
        Bright.Blue&apos;s liability is limited to the value of the booking.
        We do not accept liability for indirect or consequential losses.
      </Block>
      <Block heading="7. Contact">
        Questions? Email{" "}
        <a className="text-primary" href="mailto:legal@brightblue.com">
          legal@brightblue.com
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
