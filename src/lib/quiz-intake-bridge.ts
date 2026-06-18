/**
 * Quiz → proposal-intake taxonomy bridge.
 *
 * The recommendation quiz speaks one vocabulary (`trade-show`,
 * `lead-generation`, …) and the proposal intake wizard speaks another
 * (`activation`, `sampling`, …). Before this bridge the quiz CTA dropped its
 * `event`/`objective` params straight onto the intake form, where they matched
 * nothing — so step 0 rendered blank and the customer re-answered questions
 * they'd just answered.
 *
 * This maps the quiz taxonomy onto the intake field values so step 0 can be
 * pre-filled (and skipped) when the quiz already captured the answer.
 */

/** Canonical event types the intake wizard's radio cards accept. */
export const INTAKE_EVENT_TYPES = [
  "activation",
  "sampling",
  "vending",
  "hybrid",
  "custom",
] as const;

export type IntakeEventType = (typeof INTAKE_EVENT_TYPES)[number];

/** Quiz `eventType` signal → intake event-type radio value. */
const EVENT_TYPE_MAP: Record<string, IntakeEventType> = {
  "trade-show": "activation",
  exhibition: "activation",
  "experiential-activation": "activation",
  festival: "activation",
  corporate: "custom",
  conference: "custom",
};

/** Quiz `objective` signal → a readable line for the free-text objective field. */
const OBJECTIVE_MAP: Record<string, string> = {
  "brand-awareness": "Brand awareness and recall",
  "lead-generation": "Lead generation and pipeline",
  sampling: "Product sampling and trial",
  research: "Audience insight and research",
  "product-launch": "Product launch",
  social: "Social reach and following",
};

export interface IntakePrefill {
  /** Empty string when the quiz value can't be mapped to an intake type. */
  eventType: string;
  /** Empty string when there's no objective to carry. */
  objective: string;
}

function isIntakeEventType(value: string): value is IntakeEventType {
  return (INTAKE_EVENT_TYPES as readonly string[]).includes(value);
}

/** Map quiz `event`/`objective` URL params onto intake form field values. */
export function bridgeQuizToIntake(params: {
  event?: string | null;
  objective?: string | null;
}): IntakePrefill {
  const rawEvent = params.event?.trim() ?? "";
  const eventType = isIntakeEventType(rawEvent)
    ? rawEvent
    : (EVENT_TYPE_MAP[rawEvent] ?? "");

  const rawObjective = params.objective?.trim() ?? "";
  const objective = rawObjective
    ? (OBJECTIVE_MAP[rawObjective] ?? rawObjective)
    : "";

  return { eventType, objective };
}
