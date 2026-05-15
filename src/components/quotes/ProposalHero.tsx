/** ProposalHero — brochure hero with total + accept CTA + sticky bar on scroll */
"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Printer, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { BrandLockup } from "@/components/ui/brand-mark";
import { QuoteStatusBadge } from "./QuoteStatusBadge";
import { acceptQuote, declineQuote } from "@/app/actions/quotes";
import { celebrateBig } from "@/lib/celebrate";
import { formatDateLong } from "@/lib/dates";
import { formatGBP } from "@/lib/roi";
import type { QuoteStatus } from "@/types";

export interface ProposalHeroProps {
  quoteId: string;
  preparedForName: string;
  preparedForCompany?: string | null;
  status: QuoteStatus;
  totalPence: number;
  createdAt: string;
  expiresAt?: string | null;
  proposalNumber: string;
}

export function ProposalHero({
  quoteId,
  preparedForName,
  preparedForCompany,
  status,
  totalPence,
  createdAt,
  expiresAt,
  proposalNumber,
}: ProposalHeroProps) {
  const [loading, setLoading] = useState<"accept" | "decline" | null>(null);
  const [showSticky, setShowSticky] = useState(false);
  const acceptRef = useRef<HTMLButtonElement | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const isExpired = expiresAt ? new Date(expiresAt) < new Date() : false;
  const canRespond = status === "proposal_sent" && !isExpired;

  useEffect(() => {
    if (!canRespond) return;
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setShowSticky(!entry.isIntersecting),
      { rootMargin: "-120px 0px 0px 0px", threshold: 0 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [canRespond]);

  async function handleAction(action: "accept" | "decline") {
    setLoading(action);
    try {
      const fn = action === "accept" ? acceptQuote : declineQuote;
      await fn(quoteId);
      if (action === "accept") {
        toast.success("Proposal accepted", {
          description: "We'll be in touch shortly to kick off your event.",
        });
        celebrateBig();
      } else {
        toast.info("Proposal declined", {
          description: "Thank you for letting us know.",
        });
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(null);
    }
  }

  return (
    <>
      <section className="proposal-hero print-break-inside-avoid">
        <div className="mb-10 flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <BrandLockup tagline="EXPERIENTIAL ACTIVATION PROPOSAL" />
          <div className="text-xs text-muted-foreground sm:text-right">
            <p>Proposal #{proposalNumber}</p>
            <p>{formatDateLong(createdAt)}</p>
            {expiresAt && (
              <p className="mt-1 text-foreground/80">
                Valid until {formatDateLong(expiresAt)}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-10 md:grid-cols-[1fr_auto] md:items-end">
          <div>
            <p className="text-overline text-muted-foreground mb-3">Prepared for</p>
            <h1 className="text-display text-4xl font-bold leading-tight text-foreground md:text-5xl">
              {preparedForName}
            </h1>
            {preparedForCompany && (
              <p className="mt-2 text-lg text-muted-foreground">
                {preparedForCompany}
              </p>
            )}
            <div className="mt-5 flex items-center gap-2">
              <QuoteStatusBadge status={status} />
              {isExpired && (
                <span className="text-xs text-destructive">Expired</span>
              )}
            </div>
          </div>

          <div className="rounded-[var(--radius-card)] border border-primary/25 bg-primary/[0.06] p-6 md:p-8 md:text-right">
            <p className="text-overline text-muted-foreground">Total investment</p>
            <p className="mt-2 text-display text-5xl font-bold tabular-nums leading-none text-primary md:text-6xl">
              {formatGBP(totalPence / 100)}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">All amounts excl. VAT</p>
          </div>
        </div>

        {canRespond && (
          <div className="no-print mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button
              ref={acceptRef}
              onClick={() => handleAction("accept")}
              disabled={!!loading}
              variant="brand"
              size="lg"
              className="sm:flex-1 md:max-w-xs"
            >
              <Check className="h-4 w-4" />
              {loading === "accept" ? "Accepting…" : "Accept proposal"}
            </Button>
            <button
              type="button"
              onClick={() => handleAction("decline")}
              disabled={!!loading}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
            >
              {loading === "decline" ? "Declining…" : "Decline"}
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="ml-auto inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <Printer className="h-4 w-4" />
              Print
            </button>
          </div>
        )}

        <div ref={sentinelRef} aria-hidden className="h-px w-full" />
      </section>

      {canRespond && (
        <div
          aria-hidden={!showSticky}
          className={[
            "no-print fixed inset-x-0 bottom-0 z-40 hidden border-t border-white/[0.08] bg-[hsl(233,66%,5%,0.92)] backdrop-blur-xl md:block",
            "transition-transform duration-300",
            showSticky ? "translate-y-0" : "translate-y-full",
          ].join(" ")}
        >
          <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-6 py-3">
            <div>
              <p className="text-overline text-muted-foreground leading-none">
                Total · {preparedForName.split(" ")[0]}
              </p>
              <p className="mt-1 text-2xl font-bold leading-none text-primary tabular-nums">
                {formatGBP(totalPence / 100)}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => handleAction("decline")}
                disabled={!!loading}
                className="text-sm text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
              >
                <X className="mr-1 inline-block h-3.5 w-3.5" />
                Decline
              </button>
              <Button
                onClick={() => handleAction("accept")}
                disabled={!!loading}
                variant="brand"
                size="lg"
              >
                <Check className="h-4 w-4" />
                {loading === "accept" ? "Accepting…" : "Accept proposal"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
