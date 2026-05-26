/** Track 1 booking confirmation page */
import Link from "next/link";
import { CheckCircle2, ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { EditorialEyebrow, RidgeArtwork } from "@/components/brand";
import { getQuoteById } from "@/lib/queries/quotes";

export default async function ConfirmationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const quote = await getQuoteById(id);

  return (
    <>
      <section className="relative isolate overflow-hidden border-b border-border/40">
        <div
          aria-hidden
          className="absolute inset-x-0 top-0 ridge-color-cobalt"
          style={{ height: "clamp(220px, 26vw, 300px)" }}
        >
          <RidgeArtwork
            seed={`booking::${id}`}
            lines={22}
            amplitude={70}
            className="text-[hsl(223,94%,53%)]"
          />
          <div
            aria-hidden
            className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-background to-transparent"
          />
        </div>
        <div className="relative mx-auto max-w-2xl px-6 pt-16 md:pt-20 pb-10 text-center">
          <div className="mb-6 flex justify-center">
            <div className="h-14 w-14 rounded-full bg-[hsl(150,60%,50%)]/10 flex items-center justify-center">
              <CheckCircle2 size={32} className="text-[hsl(150,60%,50%)]" strokeWidth={1.5} />
            </div>
          </div>
          <EditorialEyebrow accent>Booking received</EditorialEyebrow>
          <h1 className="mt-2 text-display text-[clamp(2rem,3.5vw,3rem)] leading-[1.1] text-foreground">
            Thank you.
          </h1>
          <p className="mt-3 text-base text-muted-foreground leading-relaxed">
            Your booking is in. Our team will be in touch shortly with confirmation.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-2xl px-6 py-12">
        {quote && (
          <div className="space-y-1 text-sm">
            <div className="text-overline text-muted-foreground mb-2">Receipt</div>
            <div className="h-px bg-border/60" />
            <Row label="Booking reference" value={id.slice(0, 8).toUpperCase()} />
            {quote.contact_name && <Row label="Name" value={quote.contact_name} />}
            {quote.contact_email && <Row label="Email" value={quote.contact_email} />}
            {quote.event_date_start && <Row label="Event start" value={quote.event_date_start} />}
            {quote.machine_preference && <Row label="Machine" value={quote.machine_preference} />}
          </div>
        )}

        <div className="mt-10 space-y-3">
          <div className="text-overline text-muted-foreground">What happens next</div>
          <div className="h-px bg-border/60" />
          <ol className="text-sm text-muted-foreground space-y-3 pt-2 list-decimal list-inside leading-relaxed">
            <li>We&apos;ll confirm your dates and availability.</li>
            <li>You&apos;ll receive a detailed event brief.</li>
            <li>Our creative team begins your build.</li>
          </ol>
        </div>

        <div className="mt-10 flex flex-col gap-3">
          <Button asChild variant="brand" size="lg">
            <Link href="/login">
              Sign in / create account <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
          <Button variant="ghost" asChild>
            <Link href="/catalog">Browse more</Link>
          </Button>
        </div>
      </section>
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5 border-b border-border/40">
      <span className="text-overline text-muted-foreground">{label}</span>
      <span className="text-foreground text-sm">{value}</span>
    </div>
  );
}
