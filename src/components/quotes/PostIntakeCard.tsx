/**
 * PostIntakeCard — the named-experience confirmation screen.
 *
 * Replaces the transactional "Thank You" block after a customer submits an
 * intake. The customer reads: their name, the experience we'll price for them,
 * a named human, and a quiet "Adjust the experience" link that reopens the
 * RefineDrawer they used on the match card.
 *
 * Per the plan: this is confirmation, not configuration.
 */
"use client";

import { useState } from "react";
import { Mail, Settings2 } from "lucide-react";
import { toast } from "sonner";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefineDrawer } from "@/components/catalog/RefineDrawer";
import { WalkthroughBooker } from "@/components/quotes/WalkthroughBooker";
import { DEFAULT_ACCOUNT_MANAGER } from "@/lib/team";
import { getCapabilities } from "@/lib/capabilities";
import { updateQuoteCapabilities } from "@/app/actions/quotes";

interface PostIntakeCardProps {
  quoteId: string;
  contactName: string;
  /** Customer-facing package name (e.g. "Professional"). The model name is intentionally NOT surfaced — the Experience Portal is the product. */
  packageName?: string;
  capabilitySlugs: string[];
}

function firstName(full: string): string {
  return (full.trim().split(/\s+/)[0] ?? "").replace(/[.,]$/, "") || "there";
}

export function PostIntakeCard({
  quoteId,
  contactName,
  packageName,
  capabilitySlugs,
}: PostIntakeCardProps) {
  const [selected, setSelected] = useState<string[]>(capabilitySlugs);
  const [refineOpen, setRefineOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const ae = DEFAULT_ACCOUNT_MANAGER;
  const first = firstName(contactName);
  const capabilities = getCapabilities(selected);

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
            <p className="text-overline text-primary">One quick conversation</p>
            <h2 className="text-display text-3xl font-bold text-foreground md:text-4xl">
              {first}, let&apos;s build your quote — together.
            </h2>
            <p className="text-muted-foreground">
              Here&apos;s the experience {ae.firstName} will scope on your call:
            </p>
          </div>

          <div className="rounded-[var(--radius-card)] border border-border/60 bg-muted/40 p-5">
            <ul className="space-y-2 text-sm text-foreground">
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

          <div className="rounded-[var(--radius-card)] border border-primary/15 bg-primary/[0.04] p-5">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(135deg,hsl(230,93%,53%),hsl(189,100%,75%))] text-base font-semibold text-white">
                {ae.firstName.charAt(0)}
              </div>
              <div className="min-w-0 space-y-1">
                <p className="text-sm font-semibold text-foreground">
                  {ae.fullName} · {ae.title}
                </p>
                <p className="text-sm text-muted-foreground">
                  Pick a time below and {ae.firstName} will walk you through your
                  tailored proposal live — creative, projected outcomes, and
                  pricing — then email you the final version the moment you hang
                  up.
                </p>
              </div>
            </div>
            <div className="mt-4">
              <WalkthroughBooker quoteId={quoteId} aeFirstName={ae.firstName} />
            </div>
            <a
              href={`mailto:${ae.email}`}
              className="mt-3 inline-flex w-full items-center justify-center gap-1.5 text-xs text-primary underline-offset-4 hover:underline"
            >
              <Mail className="h-3 w-3" aria-hidden />
              Prefer email? Reach {ae.firstName} at {ae.email}
            </a>
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
