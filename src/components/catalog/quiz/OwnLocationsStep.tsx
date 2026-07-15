/** Free-text shortlist of customer-owned activation sites. */
"use client";

import { useState } from "react";
import { Plus, MapPin, X, Store } from "lucide-react";
import { Button } from "@/components/ui/button";

export function OwnLocationsStep({
  values,
  onChange,
}: {
  values: string[];
  onChange: (list: string[]) => void;
}) {

  const [draft, setDraft] = useState("");

  function add() {
    const v = draft.trim();
    if (!v) return;
    if (values.some((x) => x.toLowerCase() === v.toLowerCase())) {
      setDraft("");
      return;
    }
    onChange([...values, v]);
    setDraft("");
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          placeholder="e.g. London Waterloo, Westfield Stratford…"
          aria-label="Add a location"
          className="flex-1 rounded-[var(--radius-control)] border border-border bg-muted/40 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <Button type="button" variant="secondary" size="sm" onClick={add} disabled={!draft.trim()} className="shrink-0">
          <Plus className="h-4 w-4" />
          Add
        </Button>
      </div>

      {values.length > 0 ? (
        <ul className="flex flex-wrap gap-2">
          {values.map((name) => (
            <li
              key={name}
              className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 py-1.5 pl-3 pr-2 text-sm font-medium text-foreground"
            >
              <MapPin className="h-3.5 w-3.5 text-primary" aria-hidden />
              {name}
              <button
                type="button"
                onClick={() => onChange(values.filter((v) => v !== name))}
                aria-label={`Remove ${name}`}
                className="ml-0.5 flex h-5 w-5 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <X className="h-3 w-3" />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">
          No locations added yet — type a site above and press Enter.
        </p>
      )}

      <div className="flex items-start gap-2.5 rounded-[var(--radius-card)] border border-primary/20 bg-primary/[0.05] p-4">
        <Store className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
        <p className="text-[0.6875rem] leading-snug text-muted-foreground">
          Add as many sites as you like. We&apos;ll model each one&apos;s real footfall — across our
          own network and partners like Space &amp; People and Simon Property — and bring the
          numbers to your walkthrough.
        </p>
      </div>
    </div>
  );
}
