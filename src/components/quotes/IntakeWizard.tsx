/**
 * Multi-step intake wizard for Track 2 proposals.
 *
 * Same five steps as before — we deliberately do NOT add a sixth for
 * capabilities. The customer's pre-selected canonical capability slugs travel
 * silently in the URL (`?addons=…`) and are passed straight through to the
 * server action. Nothing about capabilities is shown as a configurator inside
 * the form.
 *
 * On submit we hand off to `PostIntakeCard`, which lists the named experience
 * the AE will price and exposes the only post-submit affordance: the
 * `RefineDrawer`, reopened via "Adjust the experience".
 */
"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Clock } from "lucide-react";

import { Button } from "@/components/ui/button";
import { IntakeStepEvent } from "./IntakeStepEvent";
import { IntakeStepLocation } from "./IntakeStepLocation";
import { IntakeStepRequirements } from "./IntakeStepRequirements";
import { IntakeStepCreative } from "./IntakeStepCreative";
import { IntakeStepContact } from "./IntakeStepContact";
import { PostIntakeCard } from "./PostIntakeCard";
import { submitProposalIntake } from "@/app/actions/quotes";
import { decodeCapabilityParam } from "@/lib/capabilities";
import { bridgeQuizToIntake } from "@/lib/quiz-intake-bridge";
import { briefEchoItems } from "@/lib/brief-echo";
import { RESPONSE_SLA } from "@/lib/marketing/claims";
import { cn } from "@/lib/utils";

const STEP_LABELS = [
  "The moment",
  "Where & when",
  "The brief",
  "The creative",
  "Your details",
];

interface IntakeFormData {
  eventType: string;
  objective: string;
  venueName: string;
  postcode: string;
  eventDateStart: string;
  eventDateEnd: string;
  machinePreference: string;
  gamePreference: string;
  footfallEstimate: string;
  creativeNeeds: string;
  specialRequirements: string;
  engagementScope: string;
  contactName: string;
  contactRole: string;
  contactEmail: string;
  contactPhone: string;
  companyName: string;
  // Carried silently from the quiz so the brief + projected reach land on the
  // quote (and the event lead's portal) without re-asking the customer.
  reachTrack: string;
  attendees: string;
  activationLocationKey: string;
  activationLocation: string;
  activationDays: string;
  eventTimeline: string;
  estimatedImpressions: string;
  estimatedInteractions: string;
  estimatedLeads: string;
  doohMediaValue: string;
}


function makeInitial(searchParams: URLSearchParams): IntakeFormData {
  // Translate the quiz taxonomy onto intake field values so the radio cards
  // and objective actually pre-select instead of silently falling through.
  const prefill = bridgeQuizToIntake({
    event: searchParams.get("event"),
    objective: searchParams.get("objective"),
  });
  const locationName = searchParams.get("locationName") ?? "";
  return {
    eventType: prefill.eventType,
    objective: prefill.objective,
    // For experiential, the quiz already named the site — pre-fill the venue.
    venueName: locationName,
    postcode: "",
    eventDateStart: "",
    eventDateEnd: "",
    machinePreference: searchParams.get("machine") ?? "",
    gamePreference: "",
    footfallEstimate: "",
    creativeNeeds: "",
    specialRequirements: "",
    engagementScope: "",
    contactName: "",
    contactRole: "",
    contactEmail: "",
    contactPhone: "",
    companyName: "",
    reachTrack: searchParams.get("track") ?? "",
    attendees: searchParams.get("attendees") ?? "",
    activationLocationKey: searchParams.get("location") ?? "",
    activationLocation: locationName,
    activationDays: searchParams.get("days") ?? "",
    eventTimeline: searchParams.get("timeline") ?? "",
    estimatedImpressions: searchParams.get("impressions") ?? "",
    estimatedInteractions: searchParams.get("interactions") ?? "",
    estimatedLeads: searchParams.get("leads") ?? "",
    doohMediaValue: searchParams.get("dooh") ?? "",
  };
}

/**
 * Guided multi-step intake wizard for proposal requests.
 *
 * Takes no catalogue props on purpose: every customer surface speaks one
 * umbrella product, the Experience Portal, so no model names appear here.
 */
export function IntakeWizard() {
  const searchParams = useSearchParams();

  // The URL params come from the match card's CTA. They are absorbed silently
  // here — no extra form step, no double-entry for the customer.
  const initial = useMemo(() => makeInitial(new URLSearchParams(searchParams)), [searchParams]);
  const initialAddons = useMemo(
    () => decodeCapabilityParam(searchParams.get("addons")),
    [searchParams]
  );
  const initialPackageSlug = searchParams.get("package") ?? "";

  // What the quiz already told us — surfaced as a visible "already noted"
  // strip so the customer sees their answers carried over, not re-asked.
  const quizEcho = useMemo(() => briefEchoItems(initial), [initial]);

  // If the quiz already captured the event type, skip straight to "Where & when"
  // — the customer shouldn't re-answer step 0.
  const [step, setStep] = useState(initial.eventType ? 1 : 0);
  const [data, setData] = useState<IntakeFormData>(initial);
  const [addons, setAddons] = useState<string[]>(initialAddons);
  const [submitted, setSubmitted] = useState<null | { quoteId: string }>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleChange(field: string, value: string) {
    setData((prev) => ({ ...prev, [field]: value }));
  }

  function toggleAddon(slug: string) {
    setAddons((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
    );
  }

  async function handleSubmit() {
    setLoading(true);
    setError(null);
    const result = await submitProposalIntake({
      ...data,
      // eventType is required downstream; derive a sensible one from the
      // chosen capabilities when the quiz didn't already set it.
      eventType: deriveEventType(addons, data.eventType),
      attendees: data.attendees ? Number(data.attendees) : undefined,
      activationDays: data.activationDays ? Number(data.activationDays) : undefined,
      estimatedImpressions: data.estimatedImpressions ? Number(data.estimatedImpressions) : undefined,
      estimatedInteractions: data.estimatedInteractions ? Number(data.estimatedInteractions) : undefined,
      estimatedLeads: data.estimatedLeads ? Number(data.estimatedLeads) : undefined,
      doohMediaValue: data.doohMediaValue ? Number(data.doohMediaValue) : undefined,
      addons,
      packageSlug: initialPackageSlug || undefined,
    });
    setLoading(false);
    if (result.success) {
      setSubmitted({ quoteId: result.data.id });
    } else {
      setError(result.error ?? "Something went wrong. Please try again.");
    }
  }

  const canProceed =
    (step === 0 && (addons.length > 0 || data.objective.trim().length > 0 || data.eventType)) ||
    (step === 1 && (data.postcode || data.venueName)) ||
    step === 2 ||
    step === 3 ||
    (step === 4 && data.contactName && data.contactEmail);

  if (submitted) {
    return (
      <div className="mx-auto max-w-2xl py-12">
        <PostIntakeCard
          quoteId={submitted.quoteId}
          contactName={data.contactName}
          contactEmail={data.contactEmail}
          packageName={friendlyPackageFromSlug(initialPackageSlug)}
          capabilitySlugs={addons}
          brief={data}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8 py-12">
      {quizEcho.length > 0 && (
        <div className="rounded-[var(--radius-card)] border border-primary/15 bg-primary/[0.04] px-4 py-3">
          <p className="text-xs text-muted-foreground">
            <span className="font-semibold text-primary">
              Already noted from your quiz
            </span>
            , so you won&apos;t be asked twice:
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {quizEcho.map((item) => (
              <span
                key={item.label}
                className="inline-flex items-center rounded-full border border-border/60 bg-background/70 px-2.5 py-1 text-xs font-medium text-foreground"
              >
                {item.value}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center gap-2">
        {STEP_LABELS.map((label, i) => (
          <div key={label} className="flex items-center gap-2 flex-1">
            <div
              className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors",
                i <= step ? "bg-brand text-white" : "bg-muted text-muted-foreground"
              )}
            >
              {i + 1}
            </div>
            <span className={cn("text-xs hidden sm:block", i <= step ? "text-foreground" : "text-muted-foreground")}>
              {label}
            </span>
            {i < STEP_LABELS.length - 1 && <div className="flex-1 h-px bg-border" />}
          </div>
        ))}
      </div>

      {step === 0 && (
        <IntakeStepEvent
          selectedAddons={addons}
          objective={data.objective}
          onToggleAddon={toggleAddon}
          onChange={handleChange}
        />
      )}
      {step === 1 && (
        <IntakeStepLocation
          venueName={data.venueName}
          postcode={data.postcode}
          eventDateStart={data.eventDateStart}
          eventDateEnd={data.eventDateEnd}
          onChange={handleChange}
        />
      )}
      {step === 2 && (
        <IntakeStepRequirements
          machinePreference={data.machinePreference}
          gamePreference={data.gamePreference}
          footfallEstimate={data.footfallEstimate}
          onChange={handleChange}
        />
      )}
      {step === 3 && (
        <IntakeStepCreative
          creativeNeeds={data.creativeNeeds}
          specialRequirements={data.specialRequirements}
          engagementScope={data.engagementScope}
          onChange={handleChange}
        />
      )}
      {step === 4 && (
        <IntakeStepContact
          contactName={data.contactName}
          contactRole={data.contactRole}
          contactEmail={data.contactEmail}
          contactPhone={data.contactPhone}
          companyName={data.companyName}
          onChange={handleChange}
        />
      )}

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="flex justify-between">
        <Button variant="outline" onClick={() => setStep((s) => s - 1)} disabled={step === 0}>
          Back
        </Button>
        {step < 4 ? (
          <Button onClick={() => setStep((s) => s + 1)} disabled={!canProceed}>
            Continue
          </Button>
        ) : (
          <div className="flex flex-col items-end gap-2">
            <Button onClick={handleSubmit} disabled={!canProceed || loading} variant="brand">
              {loading ? "Saving…" : "Continue to booking"}
            </Button>
            <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" aria-hidden />
              {RESPONSE_SLA.line}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Resolve a non-empty `eventType` for the quote. The quiz may have set one;
 * otherwise we infer a sensible format from the chosen capabilities so the
 * proposal narrative and validation have something concrete to work with.
 */
function deriveEventType(addons: string[], existing: string): string {
  if (existing) return existing;
  if (addons.includes("payments-onunit")) return "retail";
  if (addons.includes("sampling-unlock")) return "sampling";
  return "activation";
}

/**
 * Translate a known package slug into a readable name for the post-intake
 * card. Slugs come from the live catalogue (see `supabase/seed.sql`), so
 * if you add a new bookable package add a friendly name here too.
 */
function friendlyPackageFromSlug(slug: string): string | undefined {
  switch (slug) {
    case "bright-vend-single-day":
      return "Single day";
    case "bright-vend-pro-weekend":
      return "Weekend";
    case "bright-play-five-day":
      return "Five-day activation";
    case "bright-play-tour":
      return "Tour edition";
    case "bespoke":
      return "Bespoke";
    default:
      return undefined;
  }
}
