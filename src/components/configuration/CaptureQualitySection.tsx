"use client";

/**
 * Capture-quality settings for the game configuration form: business-emails-
 * only enforcement with an editable domain blocklist, duplicate blocking,
 * GDPR consent copy, lead retention window, and the branded landing page
 * upsell. The machine capture flow enforces these; the portal is the source
 * of truth (docs/13-dev-handover-priorities.md P2.1 / P2.3 / P2.4).
 */

import { useState } from "react";
import { Plus, X, ShieldCheck, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  normalizeDomain,
  DEFAULT_BLOCKED_DOMAINS,
  type CaptureRules,
} from "@/lib/capture-rules";

interface CaptureQualitySectionProps {
  rules: CaptureRules;
  onRulesChange: (rules: CaptureRules) => void;
  retentionDays: number;
  onRetentionChange: (days: number) => void;
  brandedLanding: boolean;
  onBrandedLandingChange: (on: boolean) => void;
}

export function CaptureQualitySection({
  rules,
  onRulesChange,
  retentionDays,
  onRetentionChange,
  brandedLanding,
  onBrandedLandingChange,
}: CaptureQualitySectionProps) {
  const [domainDraft, setDomainDraft] = useState("");
  const [domainError, setDomainError] = useState<string | null>(null);

  function addDomain() {
    const domain = normalizeDomain(domainDraft);
    if (!domain) {
      setDomainError("Enter a domain like gmail.com");
      return;
    }
    setDomainError(null);
    setDomainDraft("");
    if (rules.blockedDomains.includes(domain)) return;
    onRulesChange({ ...rules, blockedDomains: [...rules.blockedDomains, domain] });
  }

  function removeDomain(domain: string) {
    onRulesChange({
      ...rules,
      blockedDomains: rules.blockedDomains.filter((d) => d !== domain),
    });
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="flex items-center gap-1.5 text-sm font-medium text-foreground">
          <ShieldCheck size={14} className="text-[var(--color-bb-cobalt)]" aria-hidden />
          Capture quality
        </label>
        <p className="text-xs text-muted-foreground mt-0.5">
          Guardrails the machine enforces at the point of capture, so nobody
          has to police it on the day.
        </p>
      </div>

      {/* Business emails only + blocklist */}
      <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-3">
        <label className="flex items-center gap-2 text-sm text-foreground">
          <input
            type="checkbox"
            checked={rules.businessEmailsOnly}
            onChange={(e) =>
              onRulesChange({ ...rules, businessEmailsOnly: e.target.checked })
            }
            className="accent-[var(--color-bb-cobalt)]"
          />
          Business emails only
          <span className="text-xs text-muted-foreground">
            — personal domains are rejected with a &ldquo;please use your work
            email&rdquo; message
          </span>
        </label>

        {rules.businessEmailsOnly && (
          <div className="space-y-2">
            <div className="flex max-h-28 flex-wrap gap-1.5 overflow-y-auto">
              {rules.blockedDomains.map((domain) => (
                <span
                  key={domain}
                  className="inline-flex items-center gap-1 rounded-full border border-border bg-background/70 px-2 py-0.5 text-xs text-foreground"
                >
                  {domain}
                  <button
                    type="button"
                    aria-label={`Remove ${domain}`}
                    onClick={() => removeDomain(domain)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X size={11} />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <input
                value={domainDraft}
                onChange={(e) => setDomainDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addDomain();
                  }
                }}
                placeholder="Add a domain to block, e.g. yahoo.co.uk"
                className="flex-1 px-3 py-2 rounded-[var(--radius-control)] border border-border bg-muted/40 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring"
              />
              <Button variant="outline" size="sm" type="button" onClick={addDomain}>
                <Plus size={12} /> Block domain
              </Button>
              <Button
                variant="ghost"
                size="sm"
                type="button"
                onClick={() =>
                  onRulesChange({
                    ...rules,
                    blockedDomains: [...DEFAULT_BLOCKED_DOMAINS],
                  })
                }
              >
                Reset list
              </Button>
            </div>
            {domainError && (
              <p className="text-xs text-destructive">{domainError}</p>
            )}
          </div>
        )}
      </div>

      {/* Duplicate blocking */}
      <label className="flex items-center gap-2 text-sm text-foreground">
        <input
          type="checkbox"
          checked={rules.blockDuplicates}
          onChange={(e) =>
            onRulesChange({ ...rules, blockDuplicates: e.target.checked })
          }
          className="accent-[var(--color-bb-cobalt)]"
        />
        One entry per person
        <span className="text-xs text-muted-foreground">
          — repeat visitors get a friendly &ldquo;already played&rdquo; screen
        </span>
      </label>

      {/* GDPR consent */}
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm text-foreground">
          <input
            type="checkbox"
            checked={rules.consentRequired}
            onChange={(e) =>
              onRulesChange({ ...rules, consentRequired: e.target.checked })
            }
            className="accent-[var(--color-bb-cobalt)]"
          />
          Require GDPR consent checkbox
        </label>
        {rules.consentRequired && (
          <div>
            <textarea
              value={rules.consentText}
              onChange={(e) =>
                onRulesChange({ ...rules, consentText: e.target.value })
              }
              rows={3}
              aria-label="Consent copy"
              className="w-full px-3 py-2 rounded-[var(--radius-control)] border border-border bg-muted/40 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring"
            />
            <p className="text-xs text-muted-foreground mt-1">
              {"{brand}"} and {"{event}"} are filled in automatically on the
              capture form.
            </p>
          </div>
        )}
      </div>

      {/* Retention window */}
      <div className="flex items-center gap-2">
        <label htmlFor="retention-days" className="text-sm text-foreground">
          Keep captured leads for
        </label>
        <input
          id="retention-days"
          type="number"
          min={1}
          max={730}
          value={retentionDays}
          onChange={(e) => onRetentionChange(Number(e.target.value))}
          className="w-20 px-3 py-2 rounded-[var(--radius-control)] border border-border bg-muted/40 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
        />
        <span className="text-sm text-foreground">days</span>
        <span className="text-xs text-muted-foreground">
          — deleted automatically after that
        </span>
      </div>

      {/* Branded landing page upsell */}
      <div
        className={cn(
          "rounded-lg border p-3 transition-colors",
          brandedLanding
            ? "border-[var(--color-bb-cobalt)] bg-[var(--color-bb-cobalt)]/10"
            : "border-border bg-muted/30"
        )}
      >
        <label className="flex items-start gap-2 text-sm text-foreground">
          <input
            type="checkbox"
            checked={brandedLanding}
            onChange={(e) => onBrandedLandingChange(e.target.checked)}
            className="mt-0.5 accent-[var(--color-bb-cobalt)]"
          />
          <span>
            <span className="flex items-center gap-1.5 font-medium">
              <Sparkles size={13} className="text-[var(--color-bb-cobalt)]" aria-hidden />
              Branded capture landing page
            </span>
            <span className="block text-xs text-muted-foreground mt-0.5">
              The QR sign-up page is styled with your brand kit — logo,
              colours, fonts — from the guidelines you&rsquo;ve already
              provided. Priced add-on; no extra uploads needed.
            </span>
          </span>
        </label>
      </div>
    </div>
  );
}
