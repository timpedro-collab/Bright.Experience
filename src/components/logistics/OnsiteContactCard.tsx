"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { UserRound, Phone, Mail, Save, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { saveOnsiteContact, type OnsiteContact } from "@/app/actions/logistics";

interface OnsiteContactCardProps {
  eventId: string;
  contact: OnsiteContact | null;
  /** Customers fill this in; internal staff see it read-only. */
  canEdit: boolean;
}

const inputClass =
  "w-full px-3 py-2 rounded-[var(--radius-control)] border border-border bg-muted/40 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring";

export function OnsiteContactCard({
  eventId,
  contact,
  canEdit,
}: OnsiteContactCardProps) {
  const router = useRouter();
  const [saving, startSave] = useTransition();
  const [name, setName] = useState(contact?.name ?? "");
  const [phone, setPhone] = useState(contact?.phone ?? "");
  const [email, setEmail] = useState(contact?.email ?? "");
  const [notes, setNotes] = useState(contact?.notes ?? "");

  const hasContact = Boolean(contact?.name);

  function handleSave() {
    startSave(async () => {
      const result = await saveOnsiteContact(eventId, { name, phone, email, notes });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Onsite contact saved", {
        description: "Your team now knows who to find on the day.",
      });
      router.refresh();
    });
  }

  // Read-only view (internal staff, or anyone without edit rights).
  if (!canEdit) {
    return (
      <Card tone="subtle" className="p-5 space-y-3">
        <div className="flex items-center gap-2">
          <UserRound size={15} className="text-muted-foreground" />
          <h3 className="text-sm font-semibold text-foreground">Onsite contact</h3>
          {hasContact && (
            <span className="ml-auto inline-flex items-center gap-1 text-xs text-success">
              <CheckCircle2 size={12} /> Provided
            </span>
          )}
        </div>
        {hasContact ? (
          <div className="space-y-1.5 text-sm">
            <p className="font-medium text-foreground">{contact!.name}</p>
            {contact!.phone && (
              <p className="flex items-center gap-1.5 text-muted-foreground">
                <Phone size={12} /> {contact!.phone}
              </p>
            )}
            {contact!.email && (
              <p className="flex items-center gap-1.5 text-muted-foreground">
                <Mail size={12} /> {contact!.email}
              </p>
            )}
            {contact!.notes && (
              <p className="pt-1 text-muted-foreground">{contact!.notes}</p>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            The customer hasn&apos;t shared their onsite contact yet.
          </p>
        )}
      </Card>
    );
  }

  return (
    <Card tone="subtle" className="p-6 space-y-5">
      <div>
        <div className="flex items-center gap-2">
          <UserRound size={15} className="text-muted-foreground" />
          <h3 className="text-sm font-semibold text-foreground">Onsite contact</h3>
          {hasContact && (
            <span className="ml-auto inline-flex items-center gap-1 text-xs text-success">
              <CheckCircle2 size={12} /> Saved
            </span>
          )}
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Who should our team find on the day? Add the name and the best way to
          reach them.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="sm:col-span-1">
          <label className="block text-xs font-medium text-muted-foreground mb-1.5">
            Name
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Jordan Lee"
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1.5">
            Phone
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
            Email
          </label>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@company.com"
            inputMode="email"
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-muted-foreground mb-1.5">
          Anything we should know? <span className="font-normal">(optional)</span>
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Best times to reach them, where they'll be, backup contact…"
          rows={2}
          className={`${inputClass} resize-none`}
        />
      </div>

      <div className="flex justify-end pt-1">
        <Button onClick={handleSave} disabled={saving} variant="brand">
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          {saving ? "Saving…" : hasContact ? "Update contact" : "Save contact"}
        </Button>
      </div>
    </Card>
  );
}
