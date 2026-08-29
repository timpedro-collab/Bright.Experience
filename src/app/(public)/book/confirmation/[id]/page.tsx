/**
 * Book Now confirmation receipt.
 *
 * Anon users can insert a quote but cannot select it back through public
 * RLS. We use a narrow service-role read (`getBookingReceipt`) that returns
 * only receipt-safe fields — never the full quote row.
 */
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { CheckCircle2, ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { EditorialEyebrow, RidgeArtwork } from "@/components/brand";
import { getBookingReceipt } from "@/app/actions/quotes";
import { formatMoneyFromPence } from "@/lib/currency";
import { formatDateLong } from "@/lib/dates";
import { machineRenderFor } from "@/lib/machine-renders";
import { DEFAULT_ACCOUNT_MANAGER } from "@/lib/team";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function ConfirmationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!UUID_RE.test(id)) notFound();

  const receipt = await getBookingReceipt(id);
  if (!receipt) notFound();

  type Package = { name?: string };
  type Machine = { name?: string };
  const pkg = receipt.packages as Package | null;
  const machine = receipt.machines as Machine | null;

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
            className="text-[hsl(230,93%,53%)]"
          />
          <div
            aria-hidden
            className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-background to-transparent"
          />
        </div>
        <div className="relative mx-auto max-w-2xl px-6 pt-16 md:pt-20 pb-10 text-center">
          <div className="mb-6 flex justify-center">
            <div className="h-14 w-14 rounded-full bg-[hsl(150,60%,50%)]/10 flex items-center justify-center">
              <CheckCircle2
                size={32}
                className="text-[hsl(150,60%,50%)]"
                strokeWidth={1.5}
              />
            </div>
          </div>
          <EditorialEyebrow accent>Booking received</EditorialEyebrow>
          <h1 className="mt-2 text-display text-[clamp(2rem,3.5vw,3rem)] leading-[1.1] text-foreground">
            {receipt.contact_name
              ? `${receipt.contact_name.split(" ")[0]}, your dates are pencilled in.`
              : "Your dates are pencilled in."}
          </h1>
          <p className="mt-3 text-base text-muted-foreground leading-relaxed">
            Your booking is with our events team now. Your event lead will
            confirm availability and reply within one working day — usually
            much sooner.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-2xl px-6 py-12">
        {/* The thing they just bought, made visible — a machine, not a form. */}
        <div className="mb-10 flex items-center gap-5 rounded-[var(--radius-card)] border border-border/60 bg-muted/20 p-5">
          <div className="relative h-28 w-24 shrink-0">
            <Image
              src={machineRenderFor(machine?.name)}
              alt="Your machine"
              fill
              sizes="8rem"
              className="object-contain"
            />
          </div>
          <div>
            <p className="text-overline text-muted-foreground">
              What&apos;s coming
            </p>
            <p className="mt-1 text-base font-semibold text-foreground">
              {machine?.name ?? "Your Experience Portal"} — soon wearing your
              brand
            </p>
            <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
              Wrapped, loaded with your game and prizes, and delivered with a
              crew. You&apos;ll see the wrap render in your portal before it
              ships.
            </p>
          </div>
        </div>

        <div className="space-y-1 text-sm">
          <div className="text-overline text-muted-foreground mb-2">Receipt</div>
          <div className="h-px bg-border/60" />
          <Row label="Booking reference" value={id.slice(0, 8).toUpperCase()} />
          {pkg?.name && <Row label="Package" value={pkg.name} />}
          {machine?.name && <Row label="Machine" value={machine.name} />}
          {receipt.event_date_start && (
            <Row
              label="Event start"
              value={formatDateLong(receipt.event_date_start)}
            />
          )}
          {receipt.event_date_end && (
            <Row
              label="Event end"
              value={formatDateLong(receipt.event_date_end)}
            />
          )}
          {typeof receipt.total_amount === "number" && (
            <Row
              label="Estimated total"
              value={formatMoneyFromPence(receipt.total_amount, { decimals: true })}
            />
          )}
          {Array.isArray(receipt.addons) && receipt.addons.length > 0 && (
            <Row label="Add-ons" value={receipt.addons.join(", ")} />
          )}
          <p className="pt-3 text-xs text-muted-foreground">
            Keep your reference handy — quote it in any email and we&apos;ll
            know exactly which booking you mean.
          </p>
        </div>

        <div className="mt-10 space-y-3">
          <div className="text-overline text-muted-foreground">
            What happens next
          </div>
          <div className="h-px bg-border/60" />
          <ol className="text-sm text-muted-foreground space-y-3 pt-2 list-decimal list-inside leading-relaxed">
            <li>
              <span className="text-foreground">Dates confirmed.</span> Your
              event lead checks machine availability for your dates and
              confirms by email within one working day.
            </li>
            <li>
              <span className="text-foreground">Your portal opens.</span>{" "}
              We&apos;ll invite you into your event workspace — every task,
              deadline, and approval for your activation in one place.
            </li>
            <li>
              <span className="text-foreground">The build begins.</span> A
              short brief captures your brand and prizes, then our studio
              starts on your wrap and game.
            </li>
          </ol>
          <p className="pt-3 text-sm text-muted-foreground">
            You&apos;re in {DEFAULT_ACCOUNT_MANAGER.firstName}&apos;s hands —{" "}
            <span className="text-foreground">
              {DEFAULT_ACCOUNT_MANAGER.fullName}, {DEFAULT_ACCOUNT_MANAGER.title}
            </span>
            . Reach him any time at{" "}
            <a
              href={`mailto:${DEFAULT_ACCOUNT_MANAGER.email}`}
              className="text-primary underline-offset-4 hover:underline"
            >
              {DEFAULT_ACCOUNT_MANAGER.email}
            </a>
            .
          </p>
        </div>

        <div className="mt-10 flex flex-col gap-3">
          <Button asChild variant="brand" size="lg">
            <Link href="/login?redirect=/">
              Sign in to track your booking
              <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
          <Button variant="ghost" asChild>
            <Link href="/catalog">Back to the catalogue</Link>
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
