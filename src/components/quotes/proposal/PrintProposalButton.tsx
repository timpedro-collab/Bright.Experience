"use client";

/**
 * Print/"Download PDF" trigger for the proposal page.
 *
 * Lives in its own client component because the proposal page is a Server
 * Component — passing an `onClick` handler from there throws at render
 * ("Event handlers cannot be passed to Client Component props").
 */
export function PrintProposalButton() {
  return (
    <button
      onClick={() => window.print()}
      className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-1.5 text-sm font-medium text-muted-foreground transition hover:bg-muted/60 hover:text-foreground"
    >
      Download PDF
    </button>
  );
}
