"use client";

/**
 * Create a show organizer.
 *
 * Deliberately three fields: an organizer we've agreed to work with shouldn't
 * need a form filled in before we can start setting up their shows. Everything
 * else about them is edited on the record afterwards.
 */

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Building2, Loader2, Plus, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createOrganizerPartner } from "@/app/actions/organizer-admin";

export function NewOrganizerForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");

  function reset() {
    setName("");
    setContactName("");
    setContactEmail("");
    setOpen(false);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Give the organizer a name.");
      return;
    }

    startTransition(async () => {
      const result = await createOrganizerPartner({
        name: name.trim(),
        contactName: contactName.trim() || undefined,
        contactEmail: contactEmail.trim() || undefined,
      });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success(`${name.trim()} added`);
      reset();
      router.push(`/admin/organizers/${result.data.id}`);
    });
  }

  if (!open) {
    return (
      <Button variant="brand" size="sm" onClick={() => setOpen(true)}>
        <Plus size={14} /> Add an organizer
      </Button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-[var(--radius-card)] border border-border bg-card/70 p-5"
    >
      <div className="mb-4 flex items-center justify-between">
        <p className="text-heading text-sm font-semibold text-foreground">Add an organizer</p>
        <Button variant="ghost" size="sm" type="button" onClick={reset}>
          <X size={14} />
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="organizer-name">Organizer</Label>
          <Input
            id="organizer-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Informa Tech Shows"
            maxLength={200}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="organizer-contact">Main contact</Label>
          <Input
            id="organizer-contact"
            value={contactName}
            onChange={(e) => setContactName(e.target.value)}
            placeholder="Nadia Okafor"
            maxLength={200}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="organizer-email">Contact email</Label>
          <Input
            id="organizer-email"
            type="email"
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
            placeholder="nadia@informa.example"
            maxLength={320}
          />
        </div>
      </div>

      <div className="mt-5 flex items-center gap-3">
        <Button variant="brand" size="sm" type="submit" disabled={pending}>
          {pending ? <Loader2 size={14} className="animate-spin" /> : <Building2 size={14} />}
          Create organizer
        </Button>
        <p className="text-xs text-muted-foreground">
          You&apos;ll add their people, shows, and machines on the next screen.
        </p>
      </div>
    </form>
  );
}
