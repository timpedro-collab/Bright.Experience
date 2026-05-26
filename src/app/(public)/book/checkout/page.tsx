/**
 * Book Now checkout.
 *
 * Collects contact details + a clearly-labelled Stripe TEST-MODE intent
 * stub, then submits the booking via {@link submitBookNowQuote}. The action
 * re-reads the package and addons from the database to compute the
 * authoritative total — the on-screen total is a display estimate only.
 */
"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { EditorialEyebrow } from "@/components/brand";
import { submitBookNowQuote } from "@/app/actions/quotes";

interface CheckoutPageProps {
  searchParams: Promise<{
    package?: string;
    packageSlug?: string;
    machine?: string;
    game?: string;
    addons?: string;
    dateStart?: string;
    dateEnd?: string;
  }>;
}

export default function CheckoutPage({ searchParams }: CheckoutPageProps) {
  const params = use(searchParams);
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("");
  const [terms, setTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!terms || !name || !email) return;
    if (!params.package) {
      setError("No package selected — please start over from the catalogue.");
      return;
    }

    setLoading(true);
    const result = await submitBookNowQuote({
      packageId: params.package,
      machineId: params.machine || undefined,
      gameId: params.game || undefined,
      addons: params.addons ? params.addons.split(",").filter(Boolean) : [],
      eventDateStart: params.dateStart,
      eventDateEnd: params.dateEnd,
      contactName: name,
      contactEmail: email,
      contactPhone: phone || undefined,
      companyName: company || undefined,
    });
    setLoading(false);

    if (result.success) {
      router.push(`/book/confirmation/${result.data.id}`);
    } else {
      setError(result.error ?? "Something went wrong. Please try again.");
    }
  }

  return (
    <section className="mx-auto max-w-2xl px-6 py-16">
      <EditorialEyebrow accent>Book now · Final step</EditorialEyebrow>
      <h1 className="mt-2 text-display text-[clamp(2rem,3.5vw,3rem)] leading-[1.1] text-foreground">
        Checkout.
      </h1>
      <p className="mt-3 max-w-xl text-base text-muted-foreground leading-relaxed">
        Last few details and we&apos;ll send confirmation within minutes.
      </p>

      <form onSubmit={handleSubmit} className="mt-10 space-y-10">
        <section>
          <div className="text-overline text-muted-foreground mb-3">
            Contact details
          </div>
          <div className="h-px bg-border/60 mb-5" />
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full name *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company">Company</Label>
                <Input
                  id="company"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                />
              </div>
            </div>
          </div>
        </section>

        <section>
          <div className="text-overline text-muted-foreground mb-3">Summary</div>
          <div className="h-px bg-border/60 mb-5" />
          <div className="space-y-3 text-sm">
            {params.packageSlug && (
              <Row label="Package" value={params.packageSlug} />
            )}
            {params.dateStart && (
              <Row label="Start" value={params.dateStart} />
            )}
            {params.dateEnd && <Row label="End" value={params.dateEnd} />}
            {params.addons && params.addons.length > 0 && (
              <Row
                label="Add-ons"
                value={params.addons.split(",").filter(Boolean).join(", ")}
              />
            )}
          </div>
        </section>

        {/* STUB: Stripe test-mode intent — replace with real payment element in Phase 8 */}
        <section className="rounded-lg border border-dashed border-amber-500/40 bg-amber-500/5 p-4">
          <div className="flex items-start gap-3">
            <ShieldCheck className="h-5 w-5 shrink-0 text-amber-500/80" />
            <div className="space-y-1 text-sm">
              <p className="font-semibold text-foreground">
                Payment — TEST MODE
              </p>
              <p className="text-muted-foreground">
                A real Stripe payment element drops in here once we provision
                production keys. For now no card is captured and no charge is
                made; your booking is confirmed on submit and the AE will
                invoice manually.
              </p>
            </div>
          </div>
        </section>

        <label className="flex items-start gap-3 cursor-pointer">
          <Checkbox
            checked={terms}
            onCheckedChange={(v) => setTerms(v === true)}
            className="mt-0.5"
          />
          <span className="text-sm text-muted-foreground leading-relaxed">
            I agree to the{" "}
            <a
              href="/terms"
              className="text-foreground underline underline-offset-4 hover:opacity-80 transition-opacity"
            >
              terms and conditions
            </a>
            .
          </span>
        </label>

        {error && (
          <p className="text-sm text-destructive">
            {error}
          </p>
        )}

        <Button
          type="submit"
          variant="brand"
          className="w-full"
          size="lg"
          disabled={!terms || !name || !email || loading}
        >
          {loading ? "Submitting…" : "Place booking"}
        </Button>
      </form>
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
