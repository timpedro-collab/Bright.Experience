/**
 * The kit's closing move: the rep fills this in during the "yes"
 * conversation and the completed brief carries everything Bright.Blue needs
 * to deliver the activation. No backend and no auth: the output travels by
 * clipboard or a prefilled email, so it works on a show floor with nothing
 * but a browser.
 */
"use client";

import { useMemo, useState } from "react";
import { Check, Copy, Mail } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  BRIEF_OBJECTIVES,
  briefSubject,
  buildBriefText,
  type DealBriefInput,
} from "@/lib/informa/brief";
import { KIT_BRIEF_EMAIL } from "@/lib/informa/content";
import { cn } from "@/lib/utils";

function Field({
  id,
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-xs text-muted-foreground">
        {label}
      </Label>
      <Input
        id={id}
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

export function DealBriefBuilder() {
  const [brief, setBrief] = useState<DealBriefInput>({});
  const [copied, setCopied] = useState(false);

  const set = (key: keyof DealBriefInput) => (v: string) =>
    setBrief((b) => ({ ...b, [key]: v }));

  const toggleObjective = (label: string) =>
    setBrief((b) => {
      const current = b.objectives ?? [];
      return {
        ...b,
        objectives: current.includes(label)
          ? current.filter((o) => o !== label)
          : [...current, label],
      };
    });

  const text = useMemo(() => buildBriefText(brief), [brief]);

  const copy = async () => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable: the preview below stays selectable */
    }
  };

  const mailto = text
    ? `mailto:${KIT_BRIEF_EMAIL}?subject=${encodeURIComponent(briefSubject(brief))}&body=${encodeURIComponent(text)}`
    : undefined;

  return (
    <div className="grid gap-6 lg:grid-cols-[3fr_2fr]">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Fill it in as you talk</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="brief-show" label="Show" value={brief.showName ?? ""} onChange={set("showName")} placeholder="Connect Marketplace" />
            <Field id="brief-dates" label="Dates" value={brief.showDates ?? ""} onChange={set("showDates")} placeholder="24 to 26 August 2026" />
            <Field id="brief-placement" label="Placement on the floor" value={brief.placement ?? ""} onChange={set("placement")} placeholder="Registration, main aisle, lounge" />
            <Field id="brief-sponsor" label="Sponsor company" value={brief.sponsorCompany ?? ""} onChange={set("sponsorCompany")} />
            <Field id="brief-contact" label="Sponsor contact" value={brief.sponsorContact ?? ""} onChange={set("sponsorContact")} />
            <Field id="brief-email" label="Contact email" type="email" value={brief.sponsorEmail ?? ""} onChange={set("sponsorEmail")} />
          </div>

          <div className="space-y-1.5">
            <span className="text-xs text-muted-foreground">What the sponsor wants from it</span>
            <div className="flex flex-wrap gap-2">
              {BRIEF_OBJECTIVES.map((label) => {
                const active = brief.objectives?.includes(label) ?? false;
                return (
                  <button
                    key={label}
                    type="button"
                    aria-pressed={active}
                    onClick={() => toggleObjective(label)}
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-sm transition-colors",
                      active
                        ? "border-[var(--color-bb-cobalt)] bg-[var(--color-bb-cobalt)]/15 text-foreground"
                        : "border-border/70 text-muted-foreground hover:border-[var(--color-bb-cobalt)]/50"
                    )}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="brief-dispense" label="Sampling or prizes (what the machine hands out)" value={brief.dispense ?? ""} onChange={set("dispense")} placeholder="Product samples, merch, vouchers" />
            <Field id="brief-price" label="Agreed price" value={brief.agreedPrice ?? ""} onChange={set("agreedPrice")} placeholder="$40,000" />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="brief-creative" className="text-xs text-muted-foreground">
              Creative notes (campaign, colours, assets)
            </Label>
            <Textarea id="brief-creative" rows={2} value={brief.creativeNotes ?? ""} onChange={(e) => set("creativeNotes")(e.target.value)} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="brief-compliance" label="Compliance notes (alcohol, age gating, regulated)" value={brief.complianceNotes ?? ""} onChange={set("complianceNotes")} />
            <Field id="brief-rep" label="Your name" value={brief.repName ?? ""} onChange={set("repName")} />
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-3">
        <Card className="flex-1">
          <CardHeader>
            <CardTitle className="text-base">The brief Bright.Blue receives</CardTitle>
          </CardHeader>
          <CardContent>
            {text ? (
              <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-muted-foreground">
                {text}
              </pre>
            ) : (
              <p className="text-sm text-muted-foreground">
                Start filling in the deal and the delivery brief writes itself
                here. Every field is optional; send what you have.
              </p>
            )}
          </CardContent>
        </Card>

        <div className="flex flex-wrap gap-3">
          <Button onClick={copy} disabled={!text} className="gap-2">
            {copied ? <Check className="size-4" aria-hidden /> : <Copy className="size-4" aria-hidden />}
            {copied ? "Copied" : "Copy the brief"}
          </Button>
          {mailto ? (
            <Button asChild variant="outline" className="gap-2">
              <a href={mailto}>
                <Mail className="size-4" aria-hidden />
                Email it to Bright.Blue
              </a>
            </Button>
          ) : (
            <Button variant="outline" disabled className="gap-2">
              <Mail className="size-4" aria-hidden />
              Email it to Bright.Blue
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
