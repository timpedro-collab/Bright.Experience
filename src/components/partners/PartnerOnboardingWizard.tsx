/** Multi-step partner application wizard with company, contact, type, and review steps */
"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  Building2,
  User,
  Handshake,
  ClipboardCheck,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
} from "lucide-react";
import { applyAsPartner } from "@/app/actions/partners";

const STEPS = [
  { label: "Company Info", icon: Building2 },
  { label: "Contact Details", icon: User },
  { label: "Partnership Type", icon: Handshake },
  { label: "Review & Submit", icon: ClipboardCheck },
] as const;

interface FormData {
  companyName: string;
  website: string;
  industry: string;
  companySize: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  contactRole: string;
  partnerType: string;
  referralSource: string;
  notes: string;
}

const INITIAL_DATA: FormData = {
  companyName: "",
  website: "",
  industry: "",
  companySize: "",
  contactName: "",
  contactEmail: "",
  contactPhone: "",
  contactRole: "",
  partnerType: "referral",
  referralSource: "",
  notes: "",
};

const PARTNER_TYPES = [
  { value: "referral", label: "Referral Partner", desc: "Earn commission for every referred client" },
  { value: "reseller", label: "Reseller Partner", desc: "Resell Bright.Blue packages under your brand" },
  { value: "agency", label: "Agency Partner", desc: "Integrate our experiences into your events offering" },
];

export function PartnerOnboardingWizard() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormData>(INITIAL_DATA);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update(field: keyof FormData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    try {
      const result = await applyAsPartner({
        name: form.companyName || form.contactName,
        contactName: form.contactName,
        contactEmail: form.contactEmail,
        type: form.partnerType || "reseller",
        companyName: form.companyName || undefined,
        website: form.website || undefined,
        industry: form.industry || undefined,
        companySize: form.companySize || undefined,
        contactPhone: form.contactPhone || undefined,
        contactRole: form.contactRole || undefined,
        referralSource: form.referralSource || undefined,
        notes: form.notes || undefined,
      });
      if (result.success) {
        setSubmitted(true);
      } else {
        setError(result.error ?? "Something went wrong. Please try again.");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <Card className="mx-auto max-w-lg border-border/60 bg-muted/40 backdrop-blur-sm">
        <CardContent className="flex flex-col items-center gap-4 p-12 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10">
            <CheckCircle2 size={32} className="text-emerald-400" />
          </div>
          <h2 className="text-heading text-xl font-semibold text-foreground">
            Application Submitted
          </h2>
          <p className="text-sm text-muted-foreground">
            Thank you for applying to the Bright.Blue Partner Programme.
            Our partnerships team will review your application and be in touch
            within 2 business days.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <StepIndicator currentStep={step} />

      <Card className="border-border/60 bg-muted/40 backdrop-blur-sm">
        <CardContent className="p-8">
          {step === 0 && <StepCompany form={form} update={update} />}
          {step === 1 && <StepContact form={form} update={update} />}
          {step === 2 && <StepType form={form} update={update} />}
          {step === 3 && <StepReview form={form} />}

          {error && (
            <p className="mt-4 text-sm text-red-400">{error}</p>
          )}

          <div className="mt-8 flex items-center justify-between">
            <Button
              variant="outline"
              onClick={() => setStep((s) => s - 1)}
              disabled={step === 0}
              className="border-border/60 bg-muted/40 text-foreground hover:bg-accent"
            >
              <ArrowLeft size={14} className="mr-2" />
              Back
            </Button>

            {step < 3 ? (
              <Button
                onClick={() => setStep((s) => s + 1)}
                className="bg-brand text-white hover:bg-brand/90"
              >
                Continue
                <ArrowRight size={14} className="ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={submitting}
                className="bg-brand text-white hover:bg-brand/90"
              >
                {submitting ? "Submitting…" : "Submit Application"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StepIndicator({ currentStep }: { currentStep: number }) {
  return (
    <div className="flex items-center justify-between">
      {STEPS.map((s, i) => {
        const Icon = s.icon;
        const isActive = i === currentStep;
        const isComplete = i < currentStep;
        return (
          <div key={s.label} className="flex flex-1 items-center">
            <div className="flex flex-col items-center gap-2">
              <div
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-full border transition-colors",
                  isActive && "border-brand bg-brand/10 text-brand",
                  isComplete && "border-emerald-500/20 bg-emerald-500/10 text-emerald-400",
                  !isActive && !isComplete && "border-border/60 bg-muted/40 text-muted-foreground"
                )}
              >
                {isComplete ? <CheckCircle2 size={18} /> : <Icon size={18} />}
              </div>
              <span
                className={cn(
                  "hidden sm:block text-xs font-medium",
                  isActive ? "text-brand" : "text-muted-foreground"
                )}
              >
                {s.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={cn(
                  "mx-1.5 sm:mx-2 h-px flex-1",
                  isComplete ? "bg-emerald-500/30" : "bg-border"
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

function StepCompany({
  form,
  update,
}: {
  form: FormData;
  update: (f: keyof FormData, v: string) => void;
}) {
  return (
    <div className="space-y-5">
      <h3 className="text-heading text-lg font-semibold text-foreground">
        Company Information
      </h3>
      <FieldGroup label="Company Name" required>
        <Input value={form.companyName} onChange={(e) => update("companyName", e.target.value)} placeholder="Acme Events Ltd" className="border-border/60 bg-muted/40 text-foreground placeholder:text-muted-foreground" />
      </FieldGroup>
      <FieldGroup label="Website">
        <Input value={form.website} onChange={(e) => update("website", e.target.value)} placeholder="https://example.com" className="border-border/60 bg-muted/40 text-foreground placeholder:text-muted-foreground" />
      </FieldGroup>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FieldGroup label="Industry">
          <Input value={form.industry} onChange={(e) => update("industry", e.target.value)} placeholder="e.g. Marketing, Events" className="border-border/60 bg-muted/40 text-foreground placeholder:text-muted-foreground" />
        </FieldGroup>
        <FieldGroup label="Company Size">
          <Input value={form.companySize} onChange={(e) => update("companySize", e.target.value)} placeholder="e.g. 10-50" className="border-border/60 bg-muted/40 text-foreground placeholder:text-muted-foreground" />
        </FieldGroup>
      </div>
    </div>
  );
}

function StepContact({
  form,
  update,
}: {
  form: FormData;
  update: (f: keyof FormData, v: string) => void;
}) {
  return (
    <div className="space-y-5">
      <h3 className="text-heading text-lg font-semibold text-foreground">
        Contact Details
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FieldGroup label="Full Name" required>
          <Input value={form.contactName} onChange={(e) => update("contactName", e.target.value)} placeholder="Jane Smith" className="border-border/60 bg-muted/40 text-foreground placeholder:text-muted-foreground" />
        </FieldGroup>
        <FieldGroup label="Job Title">
          <Input value={form.contactRole} onChange={(e) => update("contactRole", e.target.value)} placeholder="e.g. Partnerships Manager" className="border-border/60 bg-muted/40 text-foreground placeholder:text-muted-foreground" />
        </FieldGroup>
      </div>
      <FieldGroup label="Email" required>
        <Input type="email" value={form.contactEmail} onChange={(e) => update("contactEmail", e.target.value)} placeholder="jane@example.com" className="border-border/60 bg-muted/40 text-foreground placeholder:text-muted-foreground" />
      </FieldGroup>
      <FieldGroup label="Phone">
        <Input type="tel" value={form.contactPhone} onChange={(e) => update("contactPhone", e.target.value)} placeholder="+44 20 7946 0000" className="border-border/60 bg-muted/40 text-foreground placeholder:text-muted-foreground" />
      </FieldGroup>
    </div>
  );
}

function StepType({
  form,
  update,
}: {
  form: FormData;
  update: (f: keyof FormData, v: string) => void;
}) {
  return (
    <div className="space-y-5">
      <h3 className="text-heading text-lg font-semibold text-foreground">
        Partnership Type
      </h3>
      <div className="grid gap-3">
        {PARTNER_TYPES.map((pt) => (
          <button
            key={pt.value}
            type="button"
            onClick={() => update("partnerType", pt.value)}
            className={cn(
              "flex flex-col gap-1 rounded-xl border p-4 text-left transition-colors",
              form.partnerType === pt.value
                ? "border-brand/30 bg-brand/5"
                : "border-border/60 bg-muted/40 hover:bg-accent"
            )}
          >
            <span className="text-sm font-medium text-foreground">
              {pt.label}
            </span>
            <span className="text-xs text-muted-foreground">{pt.desc}</span>
          </button>
        ))}
      </div>
      <FieldGroup label="How did you hear about us?">
        <Input value={form.referralSource} onChange={(e) => update("referralSource", e.target.value)} placeholder="e.g. LinkedIn, colleague, event" className="border-border/60 bg-muted/40 text-foreground placeholder:text-muted-foreground" />
      </FieldGroup>
      <FieldGroup label="Additional Notes">
        <textarea
          value={form.notes}
          onChange={(e) => update("notes", e.target.value)}
          rows={3}
          placeholder="Anything else you'd like us to know…"
          className="w-full rounded-md border border-border/60 bg-muted/40 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </FieldGroup>
    </div>
  );
}

function StepReview({ form }: { form: FormData }) {
  const typeLabel = PARTNER_TYPES.find((t) => t.value === form.partnerType)?.label ?? form.partnerType;

  const sections = [
    {
      title: "Company",
      items: [
        ["Company Name", form.companyName],
        ["Website", form.website],
        ["Industry", form.industry],
        ["Size", form.companySize],
      ],
    },
    {
      title: "Contact",
      items: [
        ["Name", form.contactName],
        ["Email", form.contactEmail],
        ["Phone", form.contactPhone],
        ["Role", form.contactRole],
      ],
    },
    {
      title: "Partnership",
      items: [
        ["Type", typeLabel],
        ["Referral Source", form.referralSource],
        ["Notes", form.notes],
      ],
    },
  ];

  return (
    <div className="space-y-6">
      <h3 className="text-heading text-lg font-semibold text-foreground">
        Review Your Application
      </h3>
      {sections.map((section) => (
        <div key={section.title}>
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {section.title}
          </h4>
          <div className="divide-y divide-border rounded-xl border border-border/60 bg-muted/40">
            {section.items.map(([label, value]) => (
              <div key={label} className="flex items-center justify-between px-4 py-2.5">
                <span className="text-sm text-muted-foreground">{label}</span>
                <span className="text-sm text-foreground">
                  {value || "—"}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/** Reusable label+input wrapper */
function FieldGroup({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-muted-foreground">
        {label}
        {required && <span className="ml-0.5 text-red-400">*</span>}
      </Label>
      {children}
    </div>
  );
}
