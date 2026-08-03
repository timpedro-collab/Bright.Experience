/**
 * PostIntakeCard — the named-experience confirmation screen.
 *
 * Replaces the transactional "Thank You" block after a customer submits an
 * intake. The customer reads: their own brief played back ("what you told
 * us"), the experience we'll price, a named human with a clear call agenda,
 * and the walkthrough booker. A quiet "Adjust the experience" link reopens
 * the RefineDrawer from the match card.
 *
 * Per the plan: this is confirmation, not configuration — and the whole page
 * is built to prove we listened and to make the walkthrough call feel
 * unmissable.
 */
"use client";

import { useState } from "react";
import { Clock, Settings2, Video } from "lucide-react";
import { toast } from "sonner";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefineDrawer } from "@/components/catalog/RefineDrawer";
import { WalkthroughScheduler } from "@/components/quotes/WalkthroughScheduler";
import { DEFAULT_ACCOUNT_MANAGER } from "@/lib/team";
import { getCapabilities } from "@/lib/capabilities";
import { briefEchoItems, type BriefEchoInput } from "@/lib/brief-echo";
import { RESPONSE_SLA } from "@/lib/marketing/claims";
import type { InstantEstimate } from "@/lib/pricing/instant-estimate";
import {
  formatRange,
  expectationBasisLabel,
} from "@/lib/metrics/expected-performance";
import { updateQuoteCapabilities } from "@/app/actions/quotes";

interface PostIntakeCardProps {
  quoteId: string;
  contactName: string;
  /** Prefills the Cal.com booking form when the embed is configured. */
  contactEmail?: string;
  /** Customer-facing package name (e.g. "Professional"). The model name is intentionally NOT surfaced — the Experience Portal is the product. */
  packageName?: string;
  capabilitySlugs: string[];
  /** The customer's quiz/intake answers, played back as "what you told us". */
  brief?: BriefEchoInput;
  /** Instant estimate computed at submit time; null when nothing comparable. */
  estimate?: InstantEstimate | null;
}

function firstName(full: string): string {
  return (full.trim().split(/\s+/)[0] ?? "").replace(/[.,]$/, "") || "there";
}

export function PostIntakeCard({
  quoteId,
  contactName,
  contactEmail,
  packageName,
  capabilitySlugs,
  brief,
  estimate,
}: PostIntakeCardProps) {
  const [selected, setSelected] = useState<string[]>(capabilitySlugs);
  const [refineOpen, setRefineOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const ae = DEFAULT_ACCOUNT_MANAGER;
  const first = firstName(contactName);
  const capabilities = getCapabilities(selected);
  const echo = brief ? briefEchoItems(brief) : [];

  // The whole sentence lives in one expression so the space around the name
  // can never be lost to JSX whitespace trimming.
  const aeIntro = `Pick a time below and ${ae.firstName} will walk you through your tailored proposal live on a video call. In 15 minutes you'll cover:`;

  async function handleSave(next: string[]) {
    setSaving(true);
    try {
      const result = await updateQuoteCapabilities(quoteId, next);
      if (result.success) {
        setSelected(result.data.addons);
        setRefineOpen(false);
        toast.success("Updated", {
          description: "Your tailored experience has been adjusted.",
        });
      } else {
        toast.error("Couldn't save", {
          description: result.error,
        });
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Card tone="elevated" className="relative overflow-hidden mx-auto max-w-2xl">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-20 left-1/2 h-48 w-48 -translate-x-1/2 rounded-full bg-primary/15 blur-3xl"
        />
        <CardContent className="relative space-y-7 p-7 md:p-10">
          <div className="space-y-3 text-center">
            <p className="text-overline text-primary">
              Your proposal is underway
            </p>
            <h2 className="text-display text-3xl font-bold text-foreground md:text-4xl">
              {first}, your proposal is already taking shape.
            </h2>
            <p className="text-muted-foreground">
              Everything you told us is now in front of {ae.firstName}.
              Here&apos;s the brief we&apos;re working from:
            </p>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary/[0.06] px-3 py-1 text-xs font-medium text-primary">
              <Clock className="h-3 w-3" aria-hidden />
              {RESPONSE_SLA.short}
            </span>
          </div>

          {/* What you told us — the customer's own answers, played back. */}
          {echo.length > 0 && (
            <div className="rounded-[var(--radius-card)] border border-border/60 bg-muted/40 p-5">
              <p className="text-overline text-muted-foreground">
                What you told us
              </p>
              <dl className="mt-3 grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
                {echo.map((item) => (
                  <div key={item.label} className="min-w-0">
                    <dt className="text-xs text-muted-foreground">{item.label}</dt>
                    <dd className="mt-0.5 text-sm font-medium text-foreground">
                      {item.value}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          )}

          {/* The experience we'll price. */}
          <div className="rounded-[var(--radius-card)] border border-border/60 bg-muted/40 p-5">
            <p className="text-overline text-muted-foreground">
              The experience we&apos;re pricing for you
            </p>
            <ul className="mt-3 space-y-2 text-sm text-foreground">
              <li className="flex gap-2">
                <span aria-hidden className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                <span>
                  The <span className="font-semibold">Experience Portal</span>
                  {packageName ? (
                    <>
                      {" "}on our{" "}
                      <span className="font-semibold">{packageName}</span> package
                    </>
                  ) : null}
                </span>
              </li>
              {capabilities.map((cap) => (
                <li key={cap.slug} className="flex gap-2">
                  <span
                    aria-hidden
                    className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary"
                  />
                  <span>{cap.outcome}</span>
                </li>
              ))}
              {capabilities.length === 0 && (
                <li className="flex gap-2 text-muted-foreground">
                  <span aria-hidden className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground/40" />
                  <span>A turnkey activation — no extra layers.</span>
                </li>
              )}
            </ul>
          </div>

          {/* Instant estimate — tier band + benchmark ranges, seconds after
              submitting, ahead of the exact number on the walkthrough. */}
          {estimate && (
            <div className="rounded-[var(--radius-card)] border border-border/60 bg-muted/40 p-5">
              <p className="text-overline text-muted-foreground">
                Your early numbers
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Activations like yours typically land in the{" "}
                <span className="font-semibold text-foreground">
                  {estimate.bandLabel}
                </span>{" "}
                range. Your exact figure comes on the walkthrough.
              </p>
              {(estimate.plays || estimate.leads) && (
                <dl className="mt-3 grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
                  {estimate.plays && (
                    <div>
                      <dt className="text-xs text-muted-foreground">
                        Projected plays
                      </dt>
                      <dd className="mt-0.5 text-sm font-semibold text-foreground tabular-nums">
                        {formatRange(estimate.plays.totalLow, estimate.plays.totalHigh)}
                      </dd>
                    </div>
                  )}
                  {estimate.leads && (
                    <div>
                      <dt className="text-xs text-muted-foreground">
                        Projected leads
                      </dt>
                      <dd className="mt-0.5 text-sm font-semibold text-foreground tabular-nums">
                        {formatRange(estimate.leads.totalLow, estimate.leads.totalHigh)}
                      </dd>
                    </div>
                  )}
                </dl>
              )}
              {(estimate.plays ?? estimate.leads) && (
                <p className="mt-2 text-xs text-muted-foreground">
                  {expectationBasisLabel((estimate.plays ?? estimate.leads)!)}
                </p>
              )}
            </div>
          )}

          {/* Named human + call agenda + booker. */}
          <div className="rounded-[var(--radius-card)] border border-primary/15 bg-primary/[0.04] p-5">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(135deg,hsl(230,93%,53%),hsl(189,100%,75%))] text-base font-semibold text-white">
                {ae.firstName.charAt(0)}
              </div>
              <div className="min-w-0 space-y-1">
                <p className="text-sm font-semibold text-foreground">
                  {ae.fullName} · {ae.title}
                </p>
                <p className="text-sm text-muted-foreground">{aeIntro}</p>
              </div>
            </div>

            <ol className="mt-3 space-y-1.5 pl-[3.75rem] text-sm text-foreground">
              <li className="flex gap-2">
                <span className="font-semibold text-primary tabular-nums">1.</span>
                <span>Your brand on the Experience Portal: wrap, game, and screen.</span>
              </li>
              <li className="flex gap-2">
                <span className="font-semibold text-primary tabular-nums">2.</span>
                <span>The reach and outcomes we project for your moment.</span>
              </li>
              <li className="flex gap-2">
                <span className="font-semibold text-primary tabular-nums">3.</span>
                <span>Your exact investment, live. The final proposal lands in your inbox the moment the call ends.</span>
              </li>
            </ol>

            <div className="mt-4">
              <WalkthroughScheduler
                quoteId={quoteId}
                aeFirstName={ae.firstName}
                contactName={contactName}
                contactEmail={contactEmail}
              />
            </div>
            <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
              <Video className="h-3 w-3" aria-hidden />
              Your video call link arrives with the calendar invite.
            </p>
          </div>

          <div className="flex flex-col items-center gap-2">
            <button
              type="button"
              onClick={() => setRefineOpen(true)}
              disabled={saving}
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
            >
              <Settings2 className="h-3.5 w-3.5" aria-hidden />
              {saving ? "Saving…" : "Adjust the experience"}
            </button>
            <Button variant="ghost" size="sm" asChild>
              <a href="/catalog">Keep exploring the catalogue</a>
            </Button>
          </div>
        </CardContent>
      </Card>

      <RefineDrawer
        open={refineOpen}
        onOpenChange={setRefineOpen}
        selected={selected}
        onSave={handleSave}
      />
    </>
  );
}
