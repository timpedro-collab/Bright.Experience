"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Building2, CheckCircle2, Circle, Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { EditorialEyebrow } from "@/components/brand";
import { cn } from "@/lib/utils";
import {
  addVenueRequirement,
  toggleVenueRequirement,
} from "@/app/actions/venue-requirements";
import {
  REQUIREMENT_TYPE_LABELS,
  type VenueRequirement,
  type VenueRequirementType,
} from "@/types/venue-requirements";

interface VenueRequirementsSectionProps {
  eventId: string;
  requirements: VenueRequirement[];
  isInternal: boolean;
}

export function VenueRequirementsSection({
  eventId,
  requirements,
  isInternal,
}: VenueRequirementsSectionProps) {
  const met = requirements.filter((r) => r.isMet).length;
  const total = requirements.length;

  return (
    <section className="py-6">
      <div className="flex items-baseline gap-2 mb-4">
        <Building2 size={14} className="text-muted-foreground" />
        <EditorialEyebrow>Venue requirements</EditorialEyebrow>
        {total > 0 && (
          <span className="text-xs text-muted-foreground ml-auto">
            {met} of {total} met
          </span>
        )}
      </div>

      {requirements.length === 0 && !isInternal ? (
        <p className="text-sm text-muted-foreground">No venue requirements tracked yet.</p>
      ) : (
        <div className="space-y-2">
          {requirements.map((req) => (
            <RequirementRow
              key={req.id}
              requirement={req}
              eventId={eventId}
              isInternal={isInternal}
            />
          ))}
        </div>
      )}

      {isInternal && <AddRequirementForm eventId={eventId} />}
    </section>
  );
}

function RequirementRow({
  requirement: req,
  eventId,
  isInternal,
}: {
  requirement: VenueRequirement;
  eventId: string;
  isInternal: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function handleToggle() {
    startTransition(async () => {
      const result = await toggleVenueRequirement(req.id, eventId, !req.isMet);
      if (!result.success) { toast.error(result.error); return; }
      router.refresh();
    });
  }

  return (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/40 border border-border/60">
      {isInternal ? (
        <button
          onClick={handleToggle}
          disabled={pending}
          className="mt-0.5 shrink-0"
        >
          {pending ? (
            <Loader2 size={14} className="animate-spin text-muted-foreground" />
          ) : req.isMet ? (
            <CheckCircle2 size={14} className="text-success" />
          ) : (
            <Circle size={14} className="text-muted-foreground" />
          )}
        </button>
      ) : (
        <span className="mt-0.5 shrink-0">
          {req.isMet ? (
            <CheckCircle2 size={14} className="text-success" />
          ) : (
            <Circle size={14} className="text-muted-foreground" />
          )}
        </span>
      )}
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className={cn("text-sm", req.isMet ? "text-muted-foreground line-through" : "text-foreground font-medium")}>
            {req.description}
          </span>
          <span className="text-[10px] text-muted-foreground shrink-0">
            {REQUIREMENT_TYPE_LABELS[req.requirementType]}
          </span>
        </div>
        {req.notes && isInternal && (
          <p className="text-xs text-muted-foreground mt-0.5">{req.notes}</p>
        )}
      </div>
    </div>
  );
}

function AddRequirementForm({ eventId }: { eventId: string }) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<VenueRequirementType>("power_spec");
  const [description, setDescription] = useState("");
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  if (!open) {
    return (
      <Button variant="outline" size="sm" className="mt-3" onClick={() => setOpen(true)}>
        <Plus size={12} /> Add requirement
      </Button>
    );
  }

  function handleSubmit() {
    if (!description.trim()) return;
    startTransition(async () => {
      const result = await addVenueRequirement(eventId, type, description.trim());
      if (!result.success) { toast.error(result.error); return; }
      setDescription("");
      setOpen(false);
      toast.success("Requirement added");
      router.refresh();
    });
  }

  return (
    <div className="mt-3 p-4 rounded-xl border border-border/60 bg-muted/40 space-y-3">
      <select
        aria-label="Requirement type"
        value={type}
        onChange={(e) => setType(e.target.value as VenueRequirementType)}
        className="px-3 py-2 rounded-[var(--radius-control)] border border-border bg-muted/40 text-sm text-foreground outline-none"
      >
        {Object.entries(REQUIREMENT_TYPE_LABELS).map(([key, label]) => (
          <option key={key} value={key}>{label}</option>
        ))}
      </select>
      <input
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Describe the requirement..."
        className="w-full px-3 py-2 rounded-[var(--radius-control)] border border-border bg-muted/40 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring"
      />
      <div className="flex gap-2">
        <Button size="sm" variant="brand" onClick={handleSubmit} disabled={pending}>
          {pending ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} Add
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
      </div>
    </div>
  );
}
