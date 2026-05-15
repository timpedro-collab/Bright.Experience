/** Track 1 booking confirmation page */
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, ArrowRight } from "lucide-react";
import { getQuoteById } from "@/lib/queries/quotes";

export default async function ConfirmationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const quote = await getQuoteById(id);

  return (
    <section className="mx-auto max-w-xl px-6 py-20 text-center">
      <div className="mb-6 flex justify-center">
        <CheckCircle2 size={56} className="text-success" />
      </div>
      <h1 className="text-heading text-3xl font-bold text-foreground">
        Thank You!
      </h1>
      <p className="mt-3 text-muted-foreground">
        Your booking has been received and our team will be in touch shortly.
      </p>

      {quote && (
        <Card className="mt-8 text-left">
          <CardContent className="space-y-3 pt-6 text-sm">
            <Row label="Booking Reference" value={id.slice(0, 8).toUpperCase()} />
            {quote.contact_name && <Row label="Name" value={quote.contact_name} />}
            {quote.contact_email && <Row label="Email" value={quote.contact_email} />}
            {quote.event_date_start && <Row label="Event Start" value={quote.event_date_start} />}
            {quote.machine_preference && <Row label="Machine" value={quote.machine_preference} />}
          </CardContent>
        </Card>
      )}

      <div className="mt-8 space-y-3">
        <h3 className="text-sm font-semibold text-foreground">What happens next?</h3>
        <ol className="text-sm text-muted-foreground space-y-2 text-left max-w-xs mx-auto list-decimal list-inside">
          <li>We&apos;ll confirm your dates and availability</li>
          <li>You&apos;ll receive a detailed event brief</li>
          <li>Our creative team begins your build</li>
        </ol>
      </div>

      <div className="mt-8 flex flex-col gap-3">
        <Button asChild>
          <Link href="/login">
            Sign In / Create Account <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/catalog">Browse More</Link>
        </Button>
      </div>
    </section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-foreground font-medium">{value}</span>
    </div>
  );
}
