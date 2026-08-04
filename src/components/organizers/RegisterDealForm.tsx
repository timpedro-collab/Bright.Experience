"use client";

/**
 * Register a sponsor conversation before quoting it.
 *
 * Registration is the organizer's channel protection: approval locks the
 * sponsor to them for 14 days, so a direct enquiry from the same company
 * routes back instead of competing. The form is deliberately light — a
 * company name is enough to file a claim; everything else helps us review
 * it faster.
 */

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Loader2, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { registerDeal } from "@/app/actions/deal-registrations";

export interface DealShowOption {
  id: string;
  name: string;
}

interface RegisterDealFormProps {
  partnerSlug: string;
  shows: DealShowOption[];
}

export function RegisterDealForm({ partnerSlug, shows }: RegisterDealFormProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [company, setCompany] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [eventId, setEventId] = useState("");
  const [value, setValue] = useState("");
  const [notes, setNotes] = useState("");

  function reset() {
    setCompany("");
    setContactName("");
    setContactEmail("");
    setEventId("");
    setValue("");
    setNotes("");
    setOpen(false);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!company.trim()) {
      toast.error("Who is the sponsor?");
      return;
    }

    startTransition(async () => {
      const result = await registerDeal({
        partnerSlug,
        sponsorCompany: company.trim(),
        sponsorContactName: contactName.trim() || undefined,
        sponsorContactEmail: contactEmail.trim() || undefined,
        eventId: eventId || undefined,
        estimatedValue: value ? Number(value) : undefined,
        notes: notes.trim() || undefined,
      });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success(
        result.data.alreadyRegistered
          ? `${company.trim()} is already registered to you`
          : `${company.trim()} registered — we review within 24 hours`
      );
      reset();
      router.refresh();
    });
  }

  if (!open) {
    return (
      <Button variant="brand" size="sm" onClick={() => setOpen(true)}>
        <Plus size={14} /> Register a deal
      </Button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-[var(--radius-card)] border border-border bg-card/70 p-5"
    >
      <div className="mb-4 flex items-center justify-between">
        <p className="text-heading text-sm font-semibold text-foreground">
          Register a deal
        </p>
        <Button variant="ghost" size="sm" onClick={reset} type="button">
          <X size={14} />
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="deal-company">Sponsor company</Label>
          <Input
            id="deal-company"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            placeholder="Who are you talking to?"
            maxLength={200}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="deal-show">Show (optional)</Label>
          <NativeSelect
            id="deal-show"
            value={eventId}
            onChange={(e) => setEventId(e.target.value)}
          >
            <option value="">Not tied to one show</option>
            {shows.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </NativeSelect>
        </div>

        <div className="space-y-2">
          <Label htmlFor="deal-contact">Contact name</Label>
          <Input
            id="deal-contact"
            value={contactName}
            onChange={(e) => setContactName(e.target.value)}
            maxLength={200}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="deal-email">Contact email</Label>
          <Input
            id="deal-email"
            type="email"
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="deal-value">Estimated value (£)</Label>
          <Input
            id="deal-value"
            type="number"
            min={0}
            step={500}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="15000"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="deal-notes">Notes</Label>
          <Input
            id="deal-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Anything that helps us review faster"
            maxLength={2000}
          />
        </div>
      </div>

      <div className="mt-5 flex items-center gap-2">
        <Button variant="brand" size="sm" type="submit" disabled={pending}>
          {pending ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
          Register
        </Button>
        <p className="text-xs text-muted-foreground">
          Approval locks the sponsor to you for 14 days.
        </p>
      </div>
    </form>
  );
}
