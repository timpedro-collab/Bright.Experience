/** Inline form for creating/editing a machine in the admin catalog. */
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createMachine, updateMachine } from "@/app/actions/catalog";

interface MachineFormProps {
  machine?: { id: string; name: string; slug: string; tagline: string | null };
  onClose: () => void;
}

export function MachineForm({ machine, onClose }: MachineFormProps) {
  const [name, setName] = useState(machine?.name ?? "");
  const [slug, setSlug] = useState(machine?.slug ?? "");
  const [tagline, setTagline] = useState(machine?.tagline ?? "");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const router = useRouter();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    startTransition(async () => {
      try {
        if (machine) {
          await updateMachine(machine.id, { name, tagline });
        } else {
          await createMachine({ name, slug, tagline: tagline || undefined });
        }
        router.refresh();
        onClose();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="border border-border/60 bg-card/30 rounded-md p-5 space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="name">Name</Label>
          <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        {!machine && (
          <div className="space-y-1.5">
            <Label htmlFor="slug">Slug</Label>
            <Input id="slug" value={slug} onChange={(e) => setSlug(e.target.value)} required />
          </div>
        )}
        <div className="space-y-1.5 md:col-span-2">
          <Label htmlFor="tagline">Tagline</Label>
          <Input id="tagline" value={tagline} onChange={(e) => setTagline(e.target.value)} />
        </div>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={pending}>
          {pending && <Loader2 size={14} className="animate-spin" />}
          {machine ? "Save" : "Create"}
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={onClose}>Cancel</Button>
      </div>
    </form>
  );
}
