/** Terms & conditions — placeholder content shaped for legal copy injection */
import type { Metadata } from "next";
import { Container, Section } from "@/components/ui/section";

export const metadata: Metadata = {
  title: "Terms & conditions",
  description: "Bright.Experience terms of service and conditions of use.",
};

export default function TermsPage() {
  return (
    <Section>
      <Container size="md" className="prose-invert">
        <p className="text-overline text-muted-foreground">Legal</p>
        <h1 className="text-heading mt-2 text-4xl font-bold text-foreground">
          Terms &amp; conditions
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Last updated: {new Date().toLocaleDateString("en-GB", { year: "numeric", month: "long", day: "numeric" })}
        </p>

        <div className="prose prose-invert mt-10 max-w-none">
          <Block heading="1. Acceptance">
            By accessing Bright.Experience or booking a Bright.Blue activation,
            you agree to these terms. If you are booking on behalf of a company,
            you confirm that you have authority to bind that company to these terms.
          </Block>
          <Block heading="2. Bookings & quotes">
            Quotes are valid for the period stated on the proposal. Pricing for
            experiential activations may vary by location, footfall, and the
            included media value of the placement. Bookings are confirmed when
            a deposit invoice is paid and the briefing form is submitted.
          </Block>
          <Block heading="3. Cancellations">
            Cancellations made more than 30 days before the event date are
            refundable less an admin fee. Cancellations within 30 days forfeit
            the deposit. Cancellations within 7 days are charged at the full
            booking value.
          </Block>
          <Block heading="4. Asset delivery">
            Customer-provided creative assets must be uploaded by the dates
            agreed in the event brief. Failure to deliver may result in a delayed
            go-live or default creative being used.
          </Block>
          <Block heading="5. Data & reporting">
            All leads captured during your activation are exclusively yours.
            Bright.Blue uses anonymised aggregate metrics for benchmarking and
            recommendation purposes only.
          </Block>
          <Block heading="6. Liability">
            Bright.Blue's liability is limited to the value of the booking. We
            do not accept liability for indirect or consequential losses.
          </Block>
          <Block heading="7. Contact">
            Questions? Email{" "}
            <a className="text-primary" href="mailto:legal@brightblue.com">
              legal@brightblue.com
            </a>
            .
          </Block>
        </div>
      </Container>
    </Section>
  );
}

function Block({ heading, children }: { heading: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="text-heading text-xl font-semibold text-foreground">{heading}</h2>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{children}</p>
    </section>
  );
}
