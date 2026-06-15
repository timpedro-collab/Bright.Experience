/** Inline form for creating/editing a case study in the admin catalog. */
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createCaseStudy, updateCaseStudy } from "@/app/actions/catalog-content";

interface CaseStudyFormProps {
  study?: { id: string; title: string; slug: string; client_name: string | null; event_type: string | null; location: string | null };
  onClose: () => void;
}

export function CaseStudyForm({ study, onClose }: CaseStudyFormProps) {
  const [title, setTitle] = useState(study?.title ?? "");
  const [slug, setSlug] = useState(study?.slug ?? "");
  const [clientName, setClientName] = useState(study?.client_name ?? "");
  const [eventType, setEventType] = useState(study?.event_type ?? "");
  const [location, setLocation] = useState(study?.location ?? "");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const router = useRouter();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    startTransition(async () => {
      try {
        if (study) {
          await updateCaseStudy(study.id, {
            title,
            clientName: clientName || undefined,
            eventType: eventType || undefined,
            location: location || undefined,
          });
        } else {
          await createCaseStudy({
            title,
            slug,
            clientName: clientName || undefined,
            eventType: eventType || undefined,
            location: location || undefined,
          });
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="cs-title">Title</Label>
          <Input id="cs-title" value={title} onChange={(e) => setTitle(e.target.value)} required />
        </div>
        {!study && (
          <div className="space-y-1.5">
            <Label htmlFor="cs-slug">Slug</Label>
            <Input id="cs-slug" value={slug} onChange={(e) => setSlug(e.target.value)} required />
          </div>
        )}
        <div className="space-y-1.5">
          <Label htmlFor="cs-client">Client name</Label>
          <Input id="cs-client" value={clientName} onChange={(e) => setClientName(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="cs-type">Event type</Label>
          <Input id="cs-type" value={eventType} onChange={(e) => setEventType(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="cs-location">Location</Label>
          <Input id="cs-location" value={location} onChange={(e) => setLocation(e.target.value)} />
        </div>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={pending}>
          {pending && <Loader2 size={14} className="animate-spin" />}
          {study ? "Save" : "Create"}
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={onClose}>Cancel</Button>
      </div>
    </form>
  );
}
