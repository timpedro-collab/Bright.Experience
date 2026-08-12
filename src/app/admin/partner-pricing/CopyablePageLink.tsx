"use client";

/** Copyable `/pp/:slug` path for the partner-pricing admin list. */

import { useState } from "react";
import { Check, Copy } from "lucide-react";

import { Button } from "@/components/ui/button";

interface CopyablePageLinkProps {
  slug: string;
}

export function CopyablePageLink({ slug }: CopyablePageLinkProps) {
  const path = `/pp/${slug}`;
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(path);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex items-center gap-2">
      <code className="rounded bg-muted px-2 py-1 font-mono text-xs text-foreground">
        {path}
      </code>
      <Button
        variant="ghost"
        size="sm"
        type="button"
        onClick={handleCopy}
        aria-label={`Copy ${path}`}
      >
        {copied ? <Check size={14} /> : <Copy size={14} />}
      </Button>
    </div>
  );
}
