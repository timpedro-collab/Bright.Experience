/** The copy-paste block a champion forwards to their decision-maker — the whole proposal in four lines, one click to copy. */
"use client";

import { useEffect, useRef, useState } from "react";
import { Copy } from "lucide-react";

import { Button } from "@/components/ui/button";

interface ChampionSummaryCardProps {
  lines: string[];
}

export function ChampionSummaryCard({ lines }: ChampionSummaryCardProps) {
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  async function handleCopy() {
    await navigator.clipboard.writeText(lines.join("\n"));
    setCopied(true);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="rounded-2xl border border-border bg-muted/30 p-6">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
        For the person who signs it off
      </p>
      <ul className="mt-3 space-y-1.5">
        {lines.map((line) => (
          <li key={line} className="text-sm text-foreground/90">
            {line}
          </li>
        ))}
      </ul>
      <Button variant="glass" size="sm" className="mt-4" onClick={handleCopy}>
        <Copy className="h-4 w-4" />
        {copied ? "Copied" : "Copy summary"}
      </Button>
    </div>
  );
}
