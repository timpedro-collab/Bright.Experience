/** Generates iframe embed code for a venue's public page with copy-to-clipboard. */
"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, Check, Code, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmbedCodeGeneratorProps {
  venueSlug: string;
}

export function EmbedCodeGenerator({ venueSlug }: EmbedCodeGeneratorProps) {
  const [copied, setCopied] = useState(false);

  const baseUrl = typeof window !== "undefined"
    ? window.location.origin
    : "https://app.bright.blue";

  const embedUrl = `${baseUrl}/embed/venue/${venueSlug}`;

  const embedCode = `<iframe
  src="${embedUrl}"
  width="100%"
  height="600"
  frameborder="0"
  style="border: none; border-radius: 12px;"
  title="Bright.Blue Venue Experience"
></iframe>`;

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
          <div className="relative">
            <pre className="rounded-lg bg-muted/30 border border-white/[0.06] p-4 text-xs text-muted-foreground overflow-x-auto font-mono leading-relaxed">
              {embedCode}
            </pre>
            <Button
              size="sm"
              variant="outline"
              className={cn(
                "absolute top-3 right-3 gap-1.5",
                copied && "text-emerald-400 border-emerald-400/40"
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

          <p className="text-xs text-muted-foreground">
            Paste this code into your website HTML to display an interactive
            Bright.Blue booking widget for your venue.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <ExternalLink size={16} className="text-brand" />
            Preview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-white/[0.06] bg-muted/20 p-1">
            <div className="rounded-md bg-background overflow-hidden" style={{ height: 300 }}>
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                <div className="text-center space-y-2">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-brand/10">
                    <Code size={20} className="text-brand" />
                  </div>
                  <p>Embed preview will render at</p>
                  <code className="text-xs text-brand">{embedUrl}</code>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
