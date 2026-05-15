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

import { Button } from "@/components/ui/button";
import { IntakeStepEvent } from "./IntakeStepEvent";
import { IntakeStepLocation } from "./IntakeStepLocation";
import { IntakeStepRequirements } from "./IntakeStepRequirements";
import { IntakeStepCreative } from "./IntakeStepCreative";
import { IntakeStepContact } from "./IntakeStepContact";
import { PostIntakeCard } from "./PostIntakeCard";
import { submitProposalIntake } from "@/app/actions/quotes";
import { decodeCapabilityParam } from "@/lib/capabilities";
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
  budgetIndication: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  companyName: string;
}

interface IntakeWizardProps {
  /**
   * Reserved for future flows that may need catalog data. The customer-facing
   * confirmation deliberately does NOT surface model names — every customer
   * surface speaks one umbrella product: the Experience Portal.
   */
  machines?: ReadonlyArray<{ slug: string; name: string }>;
}

function makeInitial(searchParams: URLSearchParams): IntakeFormData {
  return {
    eventType: searchParams.get("event") ?? "",
    objective: searchParams.get("objective") ?? "",
    venueName: "",
    postcode: "",
    eventDateStart: "",
    eventDateEnd: "",
    machinePreference: searchParams.get("machine") ?? "",
    gamePreference: "",
    footfallEstimate: "",
    creativeNeeds: "",
    specialRequirements: "",
    budgetIndication: "",
    contactName: "",
    contactEmail: "",
    contactPhone: "",
    companyName: "",
  };
}

/** Guided multi-step intake wizard for proposal requests. */
export function IntakeWizard(_props: IntakeWizardProps = {}) {
  const searchParams = useSearchParams();

  // The URL params come from the match card's CTA. They are absorbed silently
  // here — no extra form step, no double-entry for the customer.
  const initial = useMemo(() => makeInitial(new URLSearchParams(searchParams)), [searchParams]);
  const initialAddons = useMemo(
    () => decodeCapabilityParam(searchParams.get("addons")),
    [searchParams]
  );
  const initialPackageSlug = searchParams.get("package") ?? "";

  const [step, setStep] = useState(0);
  const [data, setData] = useState<IntakeFormData>(initial);
  const [addons, setAddons] = useState<string[]>(initialAddons);
  const [submitted, setSubmitted] = useState<null | { quoteId: string }>(null);
  const [loading, setLoading] = useState(false);

  function handleChange(field: string, value: string) {
    setData((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit() {
    setLoading(true);
    const result = await submitProposalIntake({ ...data, addons });
    setLoading(false);
    if (result.success) {
      setSubmitted({ quoteId: result.data.id });
    }
  }

  const canProceed =
    (step === 0 && data.eventType) ||
    (step === 1 && data.postcode) ||
    step === 2 ||
    step === 3 ||
    (step === 4 && data.contactName && data.contactEmail);

  if (submitted) {
    return (
      <div className="mx-auto max-w-2xl py-12">
        <PostIntakeCard
          quoteId={submitted.quoteId}
          contactName={data.contactName}
          packageName={friendlyPackageFromSlug(initialPackageSlug)}
          capabilitySlugs={addons}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8 py-12">
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
          eventType={data.eventType}
          objective={data.objective}
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
          budgetIndication={data.budgetIndication}
          onChange={handleChange}
        />
      )}
      {step === 4 && (
        <IntakeStepContact
          contactName={data.contactName}
          contactEmail={data.contactEmail}
          contactPhone={data.contactPhone}
          companyName={data.companyName}
          onChange={handleChange}
        />
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
          <Button onClick={handleSubmit} disabled={!canProceed || loading} variant="brand">
            {loading ? "Sending…" : "Send me my tailored proposal"}
          </Button>
        )}
      </div>
    </div>
  );
}

/** Translate a known package slug into a readable name. */
function friendlyPackageFromSlug(slug: string): string | undefined {
  switch (slug) {
    case "claw-starter":
      return "Starter";
    case "claw-professional":
      return "Professional";
    case "claw-sampling":
      return "Sampling";
    case "spin-starter":
      return "Starter";
    case "grab-experience":
      return "Experience";
    default:
      return undefined;
  }
}
