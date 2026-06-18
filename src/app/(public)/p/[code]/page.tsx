/**
 * Partner public landing — `/p/[code]`.
 *
 * Sets the `bb_partner` attribution cookie and renders a co-branded hero
 * with the partner's name, optional logo, and accent colour. Lives under the
 * `(public)` route group so it inherits the shared marketing nav, footer and
 * persistent attribution banner. From here the customer can dive into any
 * public funnel surface; the cookie travels silently and the server actions
 * read it on submit (see {@link submitBookNowQuote} and
 * {@link submitProposalIntake}).
 *
 * If the code doesn't match an active partner we render a friendly
 * not-found rather than redirecting to `/catalog` — the AE who shared the
 * link needs to see the typo to fix it.
 */
import Link from "next/link";
import { cookies } from "next/headers";
import { ArrowRight, Compass, FileText, ShoppingBag } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Container, Section } from "@/components/ui/section";
import { EditorialEyebrow, RidgeArtwork } from "@/components/brand";
import { PartnerCoBrand } from "@/components/public/PartnerCoBrand";
import { getPartnerByCode } from "@/lib/queries/partners";

const PARTNER_ATTRIBUTION_COOKIE = "bb_partner";
const PARTNER_ATTRIBUTION_TTL_DAYS = 30;

interface AttributionPageProps {
  params: Promise<{ code: string }>;
}

export async function generateMetadata({ params }: AttributionPageProps) {
  const { code } = await params;
  const partner = await getPartnerByCode(code);
  return {
    title: partner ? `${partner.name} × Bright.Blue` : "Welcome",
    description: partner
      ? `Browse the Bright.Experience catalog with ${partner.name} — your activation partner.`
      : "Bright.Experience — interactive activations for unforgettable events.",
  };
}

export default async function PartnerAttributionPage({
  params,
}: AttributionPageProps) {
  const { code } = await params;
  const partner = await getPartnerByCode(code);

  if (!partner) {
    return <NotFoundCard code={code} />;
  }

  const cookieStore = await cookies();
  cookieStore.set(PARTNER_ATTRIBUTION_COOKIE, code, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * PARTNER_ATTRIBUTION_TTL_DAYS,
    path: "/",
  });

  const accent = partner.brand_color ?? "hsl(230 93% 53%)";

  return (
    <>
      <section className="relative isolate overflow-hidden border-b border-border/40">
        <div
          aria-hidden
          className="absolute inset-x-0 top-0"
          style={{
            height: "clamp(240px, 28vw, 320px)",
            color: accent,
          }}
        >
          <RidgeArtwork
            seed={`partner::${code}`}
            lines={22}
            amplitude={70}
          />
          <div
            aria-hidden
            className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-background to-transparent"
          />
        </div>
        <Container className="relative pt-16 md:pt-20 pb-12">
          <PartnerCoBrand
            name={partner.name}
            logoUrl={partner.logo_url}
            accent={accent}
            className="mb-5"
          />
          <EditorialEyebrow accent>
            Partner · {partner.name}
          </EditorialEyebrow>
          <h1 className="text-display mt-2 text-[clamp(2.25rem,4.5vw,3.75rem)] leading-[1.1] text-foreground">
            Welcome — you&apos;re browsing with {partner.name}.
          </h1>
          <p className="mt-4 max-w-2xl text-base text-muted-foreground md:text-lg leading-relaxed">
            {partner.name} has handpicked Bright.Blue to power the experiential
            activation for your next event. Take a look around — anything you
            book or request a proposal for will be attributed to {partner.name}
            automatically.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild variant="brand">
              <Link href="/quiz">
                Find your fit <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="glass">
              <Link href="/catalog">Browse catalog</Link>
            </Button>
          </div>
        </Container>
      </section>

      <Section>
        <Container>
          <div className="grid gap-6 md:grid-cols-3">
            <Tile
              icon={Compass}
              title="Take the 2-minute quiz"
              body="Tell us about your event and we'll match you with a machine + game combo in seconds."
              href="/quiz"
            />
            <Tile
              icon={FileText}
              title="Get a tailored proposal"
              body="Bigger ambition? Walk us through your event and we'll come back with a custom plan."
              href="/proposal"
            />
            <Tile
              icon={ShoppingBag}
              title="Book a packaged moment"
              body="Standard packages priced and ready — configure your details and we'll confirm."
              href="/catalog/packages"
            />
          </div>
        </Container>
      </Section>
    </>
  );
}

function Tile({
  icon: Icon,
  title,
  body,
  href,
}: {
  icon: typeof Compass;
  title: string;
  body: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-[var(--radius-card)] border border-border/60 bg-muted/40 p-6 transition-all hover:border-white/20 hover:-translate-y-0.5"
    >
      <Icon className="h-6 w-6 text-primary" />
      <h3 className="mt-4 text-heading text-lg font-semibold text-foreground">
        {title}
      </h3>
      <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
        {body}
      </p>
      <p className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-foreground group-hover:text-primary transition-colors">
        Continue <ArrowRight className="h-3.5 w-3.5" />
      </p>
    </Link>
  );
}

function NotFoundCard({ code }: { code: string }) {
  return (
    <Section spacing="lg">
      <Container size="sm">
        <div className="text-center">
          <EditorialEyebrow>Partner</EditorialEyebrow>
          <h1 className="mt-2 text-display text-3xl text-foreground">
            We couldn&apos;t find that partner.
          </h1>
          <p className="mt-3 text-muted-foreground">
            The code <code className="rounded bg-muted/40 px-1.5 py-0.5">{code}</code>{" "}
            isn&apos;t active right now. If a Bright.Blue partner shared this
            link, ping them and we&apos;ll sort it out.
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <Button asChild variant="brand">
              <Link href="/catalog">Browse the catalog</Link>
            </Button>
            <Button asChild variant="ghost">
              <Link href="/quiz">Take the quiz</Link>
            </Button>
          </div>
        </div>
      </Container>
    </Section>
  );
}
