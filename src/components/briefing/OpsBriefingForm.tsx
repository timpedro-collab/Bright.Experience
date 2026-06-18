/**
 * Ops briefing form — logistical questions for event delivery.
 *
 * Parallels the creative BriefingForm but collects venue access,
 * power, WiFi, timing, health-and-safety, and staffing details that
 * the ops team needs before build day.
 */
"use client";

import { useRef, useState } from "react";
import { Save, Send, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { saveBriefingResponse } from "@/app/actions/briefing";
import { celebrateFromElement } from "@/lib/celebrate";

const OPS_BRIEFING_FIELDS = [
  {
    id: "venue_address",
    label: "Venue Address",
    type: "text" as const,
    placeholder: "Full address including postcode",
  },
  {
    id: "venue_contact",
    label: "Venue Contact",
    type: "text" as const,
    placeholder: "Name, phone, and email for the on-site venue contact",
  },
  {
    id: "access_times",
    label: "Access Times",
    type: "textarea" as const,
    placeholder:
      "When can we access for setup? When must we be cleared out? Include build, show, and de-rig windows.",
  },
  {
    id: "power_details",
    label: "Power Supply",
    type: "textarea" as const,
    placeholder:
      "Available power? (e.g. 13A sockets, 3-phase, generator). Any restrictions?",
  },
  {
    id: "wifi_connectivity",
    label: "WiFi / Connectivity",
    type: "textarea" as const,
    placeholder:
      "Is venue WiFi available? SSID/password? Should we bring our own 4G/5G backup?",
  },
  {
    id: "loading_bay",
    label: "Loading & Vehicle Access",
    type: "textarea" as const,
    placeholder:
      "Loading bay details, parking restrictions, max vehicle size, nearest drop-off point.",
  },
  {
    id: "health_safety",
    label: "Health & Safety Requirements",
    type: "textarea" as const,
    placeholder:
      "Any risk assessments, insurance docs, inductions, PPE requirements, or fire regs to note?",
  },
  {
    id: "staffing_needs",
    label: "Staffing & Brand Ambassadors",
    type: "textarea" as const,
    placeholder:
      "Do you need Bright.Blue staff on-site? How many? Any branded uniform requirements?",
  },
  {
    id: "special_requirements",
    label: "Special Requirements",
    type: "textarea" as const,
    placeholder:
      "Anything else? E.g. floor protection, noise restrictions, curfews, branded barriers, etc.",
  },
];

interface OpsBriefingFormProps {
  eventId: string;
  initialResponses: Record<string, unknown>;
  isSubmitted: boolean;
  /** Internal viewers read the customer's logistics — they never fill it in. */
  readOnly?: boolean;
}

export function OpsBriefingForm({
  eventId,
  initialResponses,
  isSubmitted: initiallySubmitted,
  readOnly = false,
}: OpsBriefingFormProps) {
  const [responses, setResponses] = useState<Record<string, string>>(
    (initialResponses as Record<string, string>) || {}
  );
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [saved, setSaved] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(initiallySubmitted);
  const submitRef = useRef<HTMLButtonElement | null>(null);

  function updateField(fieldId: string, value: string) {
    setResponses((prev) => ({ ...prev, [fieldId]: value }));
    setSaved(false);
  }

  async function handleSave() {
    setSaving(true);
    try {
      await saveBriefingResponse(eventId, "ops", responses, false);
      setSaved(true);
      toast.success("Draft saved");
    } catch (err) {
      toast.error("Couldn't save your draft", {
        description: err instanceof Error ? err.message : "Please try again.",
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleSubmit() {
    setSubmitting(true);
    try {
      await saveBriefingResponse(eventId, "ops", responses, true);
      setIsSubmitted(true);
      toast.success("Ops briefing submitted", {
        description: "The operations team will review and get back to you.",
      });
      celebrateFromElement(submitRef.current);
    } catch (err) {
      toast.error("Couldn't submit your briefing", {
        description: err instanceof Error ? err.message : "Please try again.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  if (readOnly) {
    const hasAny = OPS_BRIEFING_FIELDS.some(
      (f) => (responses[f.id] ?? "").trim().length > 0
    );
    return (
      <Card tone="subtle" className="p-6">
        {!hasAny ? (
          <p className="text-sm text-muted-foreground">
            The customer hasn&apos;t shared their logistics details yet. Their
            answers will appear here once submitted.
          </p>
        ) : (
          <div className="space-y-4">
            {OPS_BRIEFING_FIELDS.map((field) => (
              <div
                key={field.id}
                className="py-3 border-b border-border/60 last:border-0"
              >
                <p className="text-overline text-muted-foreground mb-1">
                  {field.label}
                </p>
                <p className="text-sm text-foreground whitespace-pre-line">
                  {responses[field.id]?.trim()
                    ? responses[field.id]
                    : "Not provided"}
                </p>
              </div>
            ))}
          </div>
        )}
      </Card>
    );
  }

  if (isSubmitted) {
    return (
      <Card tone="subtle" className="p-8">
        <div className="flex flex-col items-center gap-3 text-center">
          <CheckCircle2 size={40} className="text-success" />
          <h2 className="text-heading text-lg font-semibold text-foreground">
            Ops briefing submitted
          </h2>
          <p className="text-sm text-muted-foreground max-w-md">
            The operations team will review your logistics details and reach out
            if anything needs clarification.
          </p>
        </div>
        <div className="mt-8 space-y-4">
          {OPS_BRIEFING_FIELDS.map((field) => (
            <div key={field.id} className="py-3 border-b border-border/60">
              <p className="text-overline text-muted-foreground mb-1">
                {field.label}
              </p>
              <p className="text-sm text-foreground whitespace-pre-line">
                {responses[field.id] || "—"}
              </p>
            </div>
          ))}
        </div>
      </Card>
    );
  }

  return (
    <Card tone="subtle" className="p-6">
      <div className="space-y-6">
        {OPS_BRIEFING_FIELDS.map((field) => (
          <div key={field.id}>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              {field.label}
            </label>
            {field.type === "textarea" ? (
              <textarea
                value={responses[field.id] || ""}
                onChange={(e) => updateField(field.id, e.target.value)}
                placeholder={field.placeholder}
                rows={3}
                className="w-full px-4 py-2.5 rounded-[var(--radius-control)] border border-border bg-muted/40 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring resize-none"
              />
            ) : (
              <input
                type="text"
                value={responses[field.id] || ""}
                onChange={(e) => updateField(field.id, e.target.value)}
                placeholder={field.placeholder}
                className="w-full px-4 py-2.5 rounded-[var(--radius-control)] border border-border bg-muted/40 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring"
              />
            )}
          </div>
        ))}
      </div>

      <div className="flex flex-col-reverse gap-3 mt-8 pt-6 border-t border-border/60 sm:flex-row sm:items-center">
        <Button
          onClick={handleSave}
          disabled={saving}
          variant="glass"
          className="sm:w-auto"
        >
          {saving ? (
            <Loader2 size={14} className="animate-spin" />
          ) : saved ? (
            <CheckCircle2 size={14} className="text-success" />
          ) : (
            <Save size={14} />
          )}
          {saving ? "Saving…" : saved ? "Saved" : "Save draft"}
        </Button>
        <Button
          ref={submitRef}
          onClick={handleSubmit}
          disabled={submitting}
          variant="brand"
          className="sm:ml-auto"
        >
          {submitting ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Send size={14} />
          )}
          {submitting ? "Submitting…" : "Submit ops briefing"}
        </Button>
      </div>
    </Card>
  );
}
