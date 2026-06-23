/** Reseller "send a quote" form — raises an attributed quote from the portal. */
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createPartnerQuote } from "@/app/actions/partners";

const EVENT_TYPES = [
  { value: "", label: "Select type…" },
  { value: "activation", label: "Brand activation" },
  { value: "sampling", label: "Product sampling" },
  { value: "retail", label: "Retail / shopper" },
  { value: "experiential", label: "Experiential" },
];

export function PartnerQuoteForm({ slug }: { slug: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [eventType, setEventType] = useState("");
  const [eventDateStart, setEventDateStart] = useState("");
  const [estimatedValue, setEstimatedValue] = useState("");

  function reset() {
    setOpen(false);
    setError(null);
    setContactName("");
    setContactEmail("");
    setCompanyName("");
    setEventType("");
    setEventDateStart("");
    setEstimatedValue("");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const parsedValue =
      estimatedValue.trim() === "" ? undefined : Number(estimatedValue);
    startTransition(async () => {
      const result = await createPartnerQuote(slug, {
        contactName,
        contactEmail,
        companyName: companyName || undefined,
        eventType: eventType || undefined,
        eventDateStart: eventDateStart || undefined,
        estimatedValue: Number.isFinite(parsedValue) ? parsedValue : undefined,
      });
      if (result.success) {
        reset();
        setDone(true);
        setTimeout(() => setDone(false), 5000);
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  if (!open) {
    return (
      <div className="flex items-center gap-3">
        <Button size="sm" className="gap-2" onClick={() => setOpen(true)}>
          <Plus size={14} />
          Send a quote
        </Button>
        {done && (
          <span className="flex items-center gap-1.5 text-xs text-emerald-400">
            <Check size={14} />
            Quote sent and added to your pipeline.
          </span>
        )}
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold">Send a quote</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="q-name">Contact name</Label>
              <Input
                id="q-name"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                placeholder="Jordan Blake"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="q-email">Contact email</Label>
              <Input
                id="q-email"
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="jordan@brand.com"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="q-company">Company</Label>
              <Input
                id="q-company"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Brand Co."
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="q-type">Event type</Label>
              <select
                id="q-type"
                value={eventType}
                onChange={(e) => setEventType(e.target.value)}
                className="flex h-9 w-full rounded-md border border-border/60 bg-transparent px-3 py-1 text-sm outline-none focus:border-[var(--color-bb-cobalt)]"
              >
                {EVENT_TYPES.map((t) => (
                  <option key={t.value} value={t.value} className="bg-background">
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="q-date">Target date</Label>
              <Input
                id="q-date"
                type="date"
                value={eventDateStart}
                onChange={(e) => setEventDateStart(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="q-value">Estimated value ($)</Label>
              <Input
                id="q-value"
                type="number"
                min="0"
                step="0.01"
                value={estimatedValue}
                onChange={(e) => setEstimatedValue(e.target.value)}
                placeholder="0"
              />
            </div>
          </div>

          {error && <p className="text-xs text-destructive">{error}</p>}

          <div className="flex gap-2">
            <Button
              type="submit"
              size="sm"
              disabled={isPending || !contactName.trim() || !contactEmail.trim()}
            >
              {isPending ? "Sending…" : "Send quote"}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={reset}
              disabled={isPending}
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
