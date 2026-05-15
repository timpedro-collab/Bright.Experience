/** Privacy policy — placeholder structured copy */
import type { Metadata } from "next";
import { Container, Section } from "@/components/ui/section";

export const metadata: Metadata = {
  title: "Privacy policy",
  description: "How Bright.Blue Events collects, processes, and protects your data.",
};

export default function PrivacyPage() {
  return (
    <Section>
      <Container size="md">
        <p className="text-overline text-muted-foreground">Legal</p>
        <h1 className="text-heading mt-2 text-4xl font-bold text-foreground">
          Privacy policy
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Last updated: {new Date().toLocaleDateString("en-GB", { year: "numeric", month: "long", day: "numeric" })}
        </p>

        <div className="mt-10">
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
            Leads captured at your activation are passed exclusively to you,
            the event sponsor. Bright.Blue does not retain or remarket to those
            individuals.
          </Block>
          <Block heading="5. Cookies & analytics">
            We use first-party cookies to keep you signed in and to measure
            usage of the platform. We do not use third-party advertising cookies.
          </Block>
          <Block heading="6. Your rights">
            You may request access, correction, or deletion of your personal
            data at any time by emailing{" "}
            <a className="text-primary" href="mailto:privacy@brightblue.com">
              privacy@brightblue.com
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
