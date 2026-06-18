"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";

/**
 * Structured brand-colour editor shared between the creative briefing and the
 * Brand Kit card so a colour entered in one place shows up in the other.
 *
 * Storage is a single comma-separated string (e.g. "#E61A27, #111111") so it
 * round-trips through the existing `color_preferences` briefing key with no
 * schema change, and stays tolerant of free-text values customers may have
 * typed previously ("warm reds and golds").
 */

const HEX6 = /^#?[0-9a-f]{6}$/i;
const HEX3 = /^#?[0-9a-f]{3}$/i;

/** Best-effort hex for the native colour swatch; falls back to a neutral. */
function swatchValue(token: string): string {
  const t = token.trim();
  if (HEX6.test(t)) return t.startsWith("#") ? t : `#${t}`;
  if (HEX3.test(t)) {
    const h = t.replace("#", "");
    return `#${h[0]}${h[0]}${h[1]}${h[1]}${h[2]}${h[2]}`;
  }
  return "#cccccc";
}

function isHex(token: string): boolean {
  return HEX6.test(token.trim()) || HEX3.test(token.trim());
}

export function parseColors(value: string): string[] {
  return value
    .split(",")
    .map((c) => c.trim())
    .filter(Boolean);
}

interface BrandColorsFieldProps {
  value: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
}

export function BrandColorsField({ value, onChange, readOnly }: BrandColorsFieldProps) {
  // Internal working list. Seeded from the incoming value; emits a joined
  // string upward so the parent keeps a single source of truth.
  const [rows, setRows] = useState<string[]>(() => {
    const parsed = parseColors(value);
    return parsed.length > 0 ? parsed : [""];
  });

  function commit(next: string[]) {
    setRows(next);
    onChange(next.map((c) => c.trim()).filter(Boolean).join(", "));
  }

  if (readOnly) {
    const parsed = parseColors(value);
    if (parsed.length === 0) {
      return <p className="text-sm text-muted-foreground">Not provided</p>;
    }
    return (
      <div className="flex flex-wrap gap-2">
        {parsed.map((c, i) => (
          <span
            key={`${c}-${i}`}
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/40 py-1 pl-1.5 pr-2.5 text-xs text-foreground"
          >
            <span
              className="size-4 rounded-full border border-border/70"
              style={{ background: isHex(c) ? swatchValue(c) : "transparent" }}
            />
            {c}
          </span>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {rows.map((row, i) => (
        <div key={i} className="flex items-center gap-2">
          <input
            type="color"
            aria-label="Pick colour"
            value={swatchValue(row)}
            onChange={(e) => {
              const next = [...rows];
              next[i] = e.target.value.toUpperCase();
              commit(next);
            }}
            className="size-9 shrink-0 cursor-pointer rounded-[var(--radius-control)] border border-border bg-muted/40 p-0.5"
          />
          <input
            value={row}
            onChange={(e) => {
              const next = [...rows];
              next[i] = e.target.value;
              commit(next);
            }}
            placeholder="#E61A27 or a description"
            className="w-full rounded-[var(--radius-control)] border border-border bg-muted/40 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring"
          />
          {rows.length > 1 && (
            <button
              type="button"
              aria-label="Remove colour"
              onClick={() => commit(rows.filter((_, idx) => idx !== i))}
              className="shrink-0 rounded-[var(--radius-control)] p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <X size={14} />
            </button>
          )}
        </div>
      ))}
      <button
        type="button"
        onClick={() => commit([...rows, ""])}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--color-bb-cobalt)] hover:underline"
      >
        <Plus size={13} /> Add colour
      </button>
    </div>
  );
}
