"use client";

import { useRef, useState } from "react";
import { Save, Send, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { saveBriefingResponse } from "@/app/actions/briefing";
import { BrandColorsField } from "@/components/briefing/BrandColorsField";
import { RequestChangePanel } from "@/components/briefing/RequestChangePanel";
import { celebrateFromElement } from "@/lib/celebrate";

const CREATIVE_BRIEFING_FIELDS = [
  {
    id: "brand_tone",
    label: "Brand Tone & Voice",
    type: "textarea" as const,
    placeholder:
      "How would you describe your brand personality? (e.g. playful, professional, premium)",
  },
  {
    id: "target_audience",
    label: "Target Audience",
    type: "textarea" as const,
    placeholder:
      "Who are you trying to reach? Age range, interests, demographics",
  },
  {
    id: "key_messages",
    label: "Key Messages",
    type: "textarea" as const,
    placeholder: "What are the 2-3 key messages you want to communicate?",
  },
  {
    id: "color_preferences",
    label: "Brand Colours",
    type: "text" as const,
    placeholder: "Primary brand colours (hex codes if available)",
  },
  {
    id: "competitor_references",
    label: "Competitor / Inspiration References",
    type: "textarea" as const,
    placeholder: "Any brands, campaigns, or visuals that inspire you?",
  },
  {
    id: "must_include",
    label: "Must-Include Elements",
    type: "textarea" as const,
    placeholder:
      "Logos, taglines, legal text, social handles, QR codes, etc.",
  },
  {
    id: "avoid",
    label: "Things to Avoid",
    type: "textarea" as const,
    placeholder: "Any imagery, colours, messaging, or themes to steer clear of",
  },
  {
    id: "additional_notes",
    label: "Additional Notes",
    type: "textarea" as const,
    placeholder: "Anything else the creative team should know",
  },
];

interface BriefingFormProps {
  eventId: string;
  initialResponses: Record<string, unknown>;
  isSubmitted: boolean;
  /** Internal viewers read the customer's brief — they never fill it in. */
  readOnly?: boolean;
  /**
   * Creative plan is locked (event at/after build_configuration). A submitted
   * brief can no longer be edited directly — changes go through a request.
   */
  planLocked?: boolean;
}

export function BriefingForm({
  eventId,
  initialResponses,
  isSubmitted: initiallySubmitted,
  readOnly = false,
  planLocked = false,
}: BriefingFormProps) {
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
      await saveBriefingResponse(eventId, "creative", responses, false);
      setSaved(true);
      toast.success("Draft saved", {
        description: "Come back any time to pick up where you left off.",
      });
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
      await saveBriefingResponse(eventId, "creative", responses, true);
      setIsSubmitted(true);
      toast.success("Briefing submitted", {
        description: "Bright.Studio will be in touch shortly.",
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

  /** Re-save an already-submitted (but unlocked) brief, re-notifying the team. */
  async function handleUpdate() {
    setSubmitting(true);
    try {
      await saveBriefingResponse(eventId, "creative", responses, true);
      setSaved(true);
      toast.success("Brief updated", {
        description: "We've let Bright.Studio know about the change.",
      });
    } catch (err) {
      toast.error("Couldn't update your brief", {
        description: err instanceof Error ? err.message : "Please try again.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  if (readOnly) {
    const hasAny = CREATIVE_BRIEFING_FIELDS.some(
      (f) => (responses[f.id] ?? "").trim().length > 0
    );
    return (
      <Card tone="subtle" className="p-6">
        {!hasAny ? (
          <p className="text-sm text-muted-foreground">
            The customer hasn&apos;t shared their creative brief yet. Their
            answers will appear here once submitted.
          </p>
        ) : (
          <div className="space-y-4">
            {CREATIVE_BRIEFING_FIELDS.map((field) => (
              <div
                key={field.id}
                className="py-3 border-b border-border/60 last:border-0"
              >
                <p className="text-overline text-muted-foreground mb-1">
                  {field.label}
                </p>
                {field.id === "color_preferences" ? (
                  <BrandColorsField
                    value={responses[field.id] || ""}
                    onChange={() => {}}
                    readOnly
                  />
                ) : (
                  <p className="text-sm text-foreground whitespace-pre-line">
                    {responses[field.id]?.trim()
                      ? responses[field.id]
                      : "Not provided"}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    );
  }

  // Submitted AND the creative plan is locked → no direct edits; offer a
  // change request instead of a dead-end read-only wall.
  if (isSubmitted && planLocked) {
    return (
      <Card tone="subtle" className="p-8">
        <div className="flex flex-col items-center gap-3 text-center">
          <CheckCircle2 size={40} className="text-success" />
          <h2 className="text-heading text-lg font-semibold text-foreground">
            Briefing submitted
          </h2>
          <p className="text-sm text-muted-foreground max-w-md">
            Thank you for completing your creative briefing. The Bright.Studio
            team will review your responses and begin working on your creative
            deliverables.
          </p>
        </div>

        <div className="mt-8 space-y-4">
          {CREATIVE_BRIEFING_FIELDS.map((field) => (
            <div key={field.id} className="py-3 border-b border-border/60">
              <p className="text-overline text-muted-foreground mb-1">{field.label}</p>
              {field.id === "color_preferences" ? (
                <BrandColorsField
                  value={responses[field.id] || ""}
                  onChange={() => {}}
                  readOnly
                />
              ) : (
                <p className="text-sm text-foreground whitespace-pre-line">
                  {responses[field.id] || "—"}
                </p>
              )}
            </div>
          ))}
        </div>
        <RequestChangePanel eventId={eventId} formType="creative" />
      </Card>
    );
  }

  return (
    <Card tone="subtle" className="p-6">
      {isSubmitted && (
        <div className="mb-6 flex items-start gap-2 rounded-[var(--radius-control)] border border-border/60 bg-muted/30 p-3">
          <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-success" />
          <p className="text-sm text-muted-foreground">
            Submitted — you can still refine your brief while the studio gets
            started. Saving your changes lets the creative team know.
          </p>
        </div>
      )}
      <div className="space-y-6">
        {CREATIVE_BRIEFING_FIELDS.map((field) => (
          <div key={field.id}>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              {field.label}
            </label>
            {field.id === "color_preferences" ? (
              <BrandColorsField
                value={responses[field.id] || ""}
                onChange={(v) => updateField(field.id, v)}
              />
            ) : field.type === "textarea" ? (
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
        {isSubmitted ? (
          <Button
            ref={submitRef}
            onClick={handleUpdate}
            disabled={submitting}
            variant="brand"
            className="sm:ml-auto"
          >
            {submitting ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Save size={14} />
            )}
            {submitting ? "Updating…" : "Update brief"}
          </Button>
        ) : (
          <>
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
              {submitting ? "Submitting…" : "Submit briefing"}
            </Button>
          </>
        )}
      </div>
    </Card>
  );
}
