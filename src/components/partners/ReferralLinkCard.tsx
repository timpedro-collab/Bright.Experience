/** Partner referral link card — copy + QR code for sharing */
"use client";

import { useMemo, useState } from "react";
import { Copy, Check, ExternalLink, QrCode } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface ReferralLinkCardProps {
  partnerCode: string;
  partnerName: string;
  className?: string;
}

export function ReferralLinkCard({
  partnerCode,
  partnerName,
  className,
}: ReferralLinkCardProps) {
  const [copied, setCopied] = useState(false);

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const referralUrl = useMemo(
    () => (origin ? `${origin}/p/${partnerCode}` : `/p/${partnerCode}`),
    [origin, partnerCode]
  );

  // Encode QR via Google Charts API (zero deps, works offline-cached)
  // QR API requires literal fg/bg hex — not theme-controlled surface colours.
  const qrUrl = useMemo(
    () =>
      `https://api.qrserver.com/v1/create-qr-code/?size=160x160&margin=0&format=svg&color=ffffff&bgcolor=0d1640&data=${encodeURIComponent(referralUrl)}`,
    [referralUrl]
  );

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(referralUrl);
      setCopied(true);
      toast.success("Referral link copied");
      setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error("Couldn't copy. Try selecting the link manually.");
    }
  }

  return (
    <Card
      tone="elevated"
      className={cn(
        "relative overflow-hidden",
        "before:absolute before:-right-12 before:-top-12 before:h-44 before:w-44 before:rounded-full before:bg-primary/15 before:blur-3xl before:content-['']",
        className
      )}
    >
      <CardContent className="relative grid gap-6 p-6 md:grid-cols-[1fr_auto] md:items-center">
        <div className="min-w-0">
          <p className="text-overline text-muted-foreground mb-1">Your referral link</p>
          <h3 className="text-heading text-lg font-semibold text-foreground">
            Share Bright.Blue with your clients
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Anyone who books via this link is auto-attributed to {partnerName}. Commission tracking starts immediately.
          </p>

          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
            <code className="flex-1 truncate rounded-[var(--radius-control)] border border-border bg-muted/30 px-3 py-2 font-mono text-xs text-foreground">
              {referralUrl}
            </code>
            <div className="flex gap-2">
              <Button
                onClick={handleCopy}
                variant={copied ? "default" : "brand"}
                size="sm"
                className="shrink-0"
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? "Copied" : "Copy"}
              </Button>
              <Button asChild variant="glass" size="sm" className="shrink-0">
                <a href={referralUrl} target="_blank" rel="noreferrer">
                  <ExternalLink className="h-4 w-4" />
                  Preview
                </a>
              </Button>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center gap-2">
          <div className="rounded-[var(--radius-card)] border border-border bg-card p-3">
            {/* QR API requires literal fg/bg hex — not theme-controlled surface colours. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={qrUrl}
              alt={`QR code for ${referralUrl}`}
              width={144}
              height={144}
              className="rounded-sm"
            />
          </div>
          <p className="flex items-center gap-1 text-overline text-muted-foreground">
            <QrCode className="h-3 w-3" /> Scan to open
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
