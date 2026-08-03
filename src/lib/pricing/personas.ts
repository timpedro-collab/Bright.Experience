/**
 * Persona vocabulary for the audience-aware pricing page (docs/20 §3).
 *
 * Lives in lib (not in the client component) so server components can
 * validate the `?for=` deep-link param: non-component exports of a
 * `"use client"` module are client references on the server and throw when
 * used — importing the list from the explorer crashed /pricing in production.
 */

export type PricingPersona = "brand" | "agency" | "organizer" | "venue";

export const PRICING_PERSONAS: ReadonlyArray<{
  id: PricingPersona;
  label: string;
}> = [
  { id: "brand", label: "I'm a brand" },
  { id: "agency", label: "I'm an agency" },
  { id: "organizer", label: "I run events" },
  { id: "venue", label: "I have a venue" },
];

/** True when `value` is a valid persona id. Use on untrusted boundaries (URL params). */
export function isPricingPersona(value: unknown): value is PricingPersona {
  return (
    typeof value === "string" && PRICING_PERSONAS.some((p) => p.id === value)
  );
}
