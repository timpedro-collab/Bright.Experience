/** Track 1 checkout — contact details and booking submission */
"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { submitBookNowQuote } from "@/app/actions/quotes";

interface CheckoutPageProps {
  searchParams: Promise<{
    package?: string;
    machine?: string;
    game?: string;
    addons?: string;
    dateStart?: string;
    dateEnd?: string;
    total?: string;
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

  const totalPence = parseInt(params.total ?? "0", 10);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!terms || !name || !email) return;

    setLoading(true);
    const result = await submitBookNowQuote({
      packageId: params.package ?? "",
      machinePreference: params.machine,
      gamePreference: params.game,
      addons: params.addons ? params.addons.split(",") : [],
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
    }
  }

  return (
    <section className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="text-heading text-3xl font-bold text-foreground mb-8">
        Checkout
      </h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader><CardTitle>Contact Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name *</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company">Company</Label>
                <Input id="company" value={company} onChange={(e) => setCompany(e.target.value)} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Summary</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            {params.machine && <Row label="Machine" value={params.machine} />}
            {params.game && <Row label="Game" value={params.game} />}
            {params.dateStart && <Row label="Start" value={params.dateStart} />}
            {params.dateEnd && <Row label="End" value={params.dateEnd} />}
            <Separator />
            <div className="flex justify-between text-lg font-bold text-foreground">
              <span>Total</span>
              <span>£{(totalPence / 100).toLocaleString("en-GB", { minimumFractionDigits: 2 })}</span>
            </div>
          </CardContent>
        </Card>

        <label className="flex items-start gap-3 cursor-pointer">
          <Checkbox checked={terms} onCheckedChange={(v) => setTerms(v === true)} className="mt-0.5" />
          <span className="text-sm text-muted-foreground">
            I agree to the{" "}
            <a href="/terms" className="text-brand hover:underline">terms and conditions</a>.
          </span>
        </label>

        <Button type="submit" className="w-full" size="lg" disabled={!terms || !name || !email || loading}>
          {loading ? "Submitting…" : "Place Booking"}
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
