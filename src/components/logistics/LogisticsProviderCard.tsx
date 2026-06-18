"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Truck, Phone, UserRound, Hash, Save, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { saveLogisticsProvider, type LogisticsProvider } from "@/app/actions/logistics";

interface LogisticsProviderCardProps {
  eventId: string;
  provider: LogisticsProvider | null;
  /** Internal/ops staff edit this; customers see it read-only. */
  canEdit: boolean;
}

const inputClass =
  "w-full px-3 py-2 rounded-[var(--radius-control)] border border-border bg-muted/40 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring";

export function LogisticsProviderCard({
  eventId,
  provider,
  canEdit,
}: LogisticsProviderCardProps) {
  const router = useRouter();
  const [saving, startSave] = useTransition();
  const [company, setCompany] = useState(provider?.company ?? "");
  const [contactName, setContactName] = useState(provider?.contactName ?? "");
  const [phone, setPhone] = useState(provider?.phone ?? "");
  const [reference, setReference] = useState(provider?.reference ?? "");
  const [notes, setNotes] = useState(provider?.notes ?? "");

  const hasProvider = Boolean(provider?.company);

  function handleSave() {
    startSave(async () => {
      const result = await saveLogisticsProvider(eventId, {
        company,
        contactName,
        phone,
        reference,
        notes,
      });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Logistics provider saved");
      router.refresh();
    });
  }

  // Read-only view (customers). Stay quiet until ops has assigned a provider.
  if (!canEdit) {
    if (!hasProvider) return null;
    return (
      <Card tone="subtle" className="p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Truck size={15} className="text-muted-foreground" />
          <h3 className="text-sm font-semibold text-foreground">Logistics provider</h3>
          <span className="ml-auto inline-flex items-center gap-1 text-xs text-success">
            <CheckCircle2 size={12} /> Confirmed
          </span>
        </div>
        <div className="space-y-1.5 text-sm">
          <p className="font-medium text-foreground">{provider!.company}</p>
          {provider!.contactName && (
            <p className="flex items-center gap-1.5 text-muted-foreground">
              <UserRound size={12} /> {provider!.contactName}
            </p>
          )}
          {provider!.phone && (
            <p className="flex items-center gap-1.5 text-muted-foreground">
              <Phone size={12} /> {provider!.phone}
            </p>
          )}
          {provider!.reference && (
            <p className="flex items-center gap-1.5 text-muted-foreground">
              <Hash size={12} /> {provider!.reference}
            </p>
          )}
          {provider!.notes && (
            <p className="pt-1 text-muted-foreground">{provider!.notes}</p>
          )}
        </div>
      </Card>
    );
  }

  return (
    <Card tone="subtle" className="p-6 space-y-5">
      <div>
        <div className="flex items-center gap-2">
          <Truck size={15} className="text-muted-foreground" />
          <h3 className="text-sm font-semibold text-foreground">Logistics provider</h3>
          {hasProvider && (
            <span className="ml-auto inline-flex items-center gap-1 text-xs text-success">
              <CheckCircle2 size={12} /> Saved
            </span>
          )}
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          The carrier handling delivery and collection. Saved to the record and
          shown to the customer once confirmed.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1.5">
            Company
          </label>
          <input
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            placeholder="e.g. DHL Express, Bright.Blue Fleet"
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1.5">
            Contact name <span className="font-normal">(optional)</span>
          </label>
          <input
            value={contactName}
            onChange={(e) => setContactName(e.target.value)}
            placeholder="Driver or account contact"
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1.5">
            Phone <span className="font-normal">(optional)</span>
          </label>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+44 7700 900000"
            inputMode="tel"
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1.5">
            Booking / tracking ref <span className="font-normal">(optional)</span>
          </label>
          <input
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            placeholder="e.g. CONS-48213"
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-muted-foreground mb-1.5">
          Notes <span className="font-normal">(optional)</span>
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Vehicle, access requirements, anything the team should know…"
          rows={2}
          className={`${inputClass} resize-none`}
        />
      </div>

      <div className="flex justify-end pt-1">
        <Button onClick={handleSave} disabled={saving} variant="brand">
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          {saving ? "Saving…" : hasProvider ? "Update provider" : "Save provider"}
        </Button>
      </div>
    </Card>
  );
}
