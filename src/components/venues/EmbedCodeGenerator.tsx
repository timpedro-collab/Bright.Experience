/** Generates iframe embed code for a venue's public page with copy-to-clipboard. */
"use client";

import { useState, useSyncExternalStore } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, Check, Code, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmbedCodeGeneratorProps {
  venueSlug: string;
}

type EmbedVariant = "full" | "widget";

const VARIANT_OPTIONS: { value: EmbedVariant; label: string }[] = [
  { value: "full", label: "Full advertise page" },
  { value: "widget", label: "Compact widget" },
];

function buildEmbedConfig(baseUrl: string, venueSlug: string, variant: EmbedVariant) {
  if (variant === "widget") {
    return {
      embedUrl: `${baseUrl}/venues/${venueSlug}/widget`,
      embedCode: `<iframe
  src="${baseUrl}/venues/${venueSlug}/widget"
  width="360"
  height="420"
  frameborder="0"
  style="border: none; border-radius: 12px;"
  title="Bright.Blue Venue Experience"
></iframe>`,
      previewHeight: 420,
      description:
        "Paste this code into your website HTML to display a compact Bright.Blue booking widget for your venue.",
      previewNote:
        "This is exactly what your visitors will see — the compact widget, rendered live from your venue link.",
    };
  }

  return {
    embedUrl: `${baseUrl}/venues/${venueSlug}/advertise`,
    embedCode: `<iframe
  src="${baseUrl}/venues/${venueSlug}/advertise"
  width="100%"
  height="600"
  frameborder="0"
  style="border: none; border-radius: 12px;"
  title="Bright.Blue Venue Experience"
></iframe>`,
    previewHeight: 480,
    description:
      "Paste this code into your website HTML to display an interactive Bright.Blue booking widget for your venue.",
    previewNote:
      "This is exactly what your visitors will see — the real booking widget, rendered live from your venue link.",
  };
}

const noopSubscribe = () => () => {};

export function EmbedCodeGenerator({ venueSlug }: EmbedCodeGeneratorProps) {
  const [copied, setCopied] = useState(false);
  const [variant, setVariant] = useState<EmbedVariant>("full");

  // The snippet must carry the site the venue is actually on, which only the
  // browser knows. Read it via useSyncExternalStore so the server render and
  // hydration agree (null → fallback), then a normal post-hydration re-render
  // swaps in the real origin — no hydration mismatch, and the preview iframe
  // never frames a foreign host.
  const origin = useSyncExternalStore(
    noopSubscribe,
    () => window.location.origin,
    () => null,
  );
  const baseUrl = origin ?? "https://app.bright.blue";

  const { embedUrl, embedCode, previewHeight, description, previewNote } =
    buildEmbedConfig(baseUrl, venueSlug, variant);

  async function handleCopy() {
    await navigator.clipboard.writeText(embedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Code size={16} className="text-brand" />
              Embed Code
            </CardTitle>
            <Badge variant="outline" className="text-xs text-muted-foreground">
              iframe
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {VARIANT_OPTIONS.map((option) => (
              <Button
                key={option.value}
                type="button"
                size="sm"
                variant={variant === option.value ? "default" : "outline"}
                onClick={() => {
                  setVariant(option.value);
                  setCopied(false);
                }}
              >
                {option.label}
              </Button>
            ))}
          </div>

          {variant === "widget" && (
            <p className="text-xs text-muted-foreground">
              Fits a sidebar. Links out to your full advertise page with venue
              attribution.
            </p>
          )}

          <div className="relative">
            <pre className="rounded-lg bg-muted/30 border border-border/60 p-4 text-xs text-muted-foreground overflow-x-auto font-mono leading-relaxed">
              {embedCode}
            </pre>
            <Button
              size="sm"
              variant="outline"
              className={cn(
                "absolute top-3 right-3 gap-1.5",
                copied && "text-success border-success/40",
              )}
              onClick={handleCopy}
            >
              {copied ? (
                <>
                  <Check size={12} />
                  Copied
                </>
              ) : (
                <>
                  <Copy size={12} />
                  Copy
                </>
              )}
            </Button>
          </div>

          <p className="text-xs text-muted-foreground">{description}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <ExternalLink size={16} className="text-brand" />
              Live preview
            </CardTitle>
            <Button asChild size="sm" variant="outline" className="gap-1.5">
              <a href={embedUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink size={12} />
                Open
              </a>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <p className="mb-3 text-xs text-muted-foreground">{previewNote}</p>
          <div
            className={cn(
              "rounded-lg border border-border/60 bg-muted/20 p-1",
              variant === "widget" && "mx-auto max-w-[360px]",
            )}
          >
            {/* Mount the frame only once the real origin is known, so the
                server-rendered markup never frames a foreign host (CSP). */}
            {origin !== null ? (
              <iframe
                src={embedUrl}
                title="Bright.Blue Venue Experience preview"
                className={cn(
                  "rounded-md bg-background",
                  variant === "widget" ? "w-[360px]" : "w-full",
                )}
                style={{ height: previewHeight }}
              />
            ) : (
              <div
                className="animate-pulse rounded-md bg-muted/40"
                style={{ height: previewHeight }}
              />
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
