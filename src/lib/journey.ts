/**
 * The shared event "journey spine".
 *
 * Every role sees the same four-phase lifecycle (Create → Prepare → Event day
 * → Results) derived from the 10 internal stages. This module is the single
 * source of truth for:
 *
 *   - mapping a stage to its phase (`phaseForStage`)
 *   - building the ordered phase timeline with done/current/upcoming state and
 *     milestone chips for a given event (`buildJourney`)
 *
 * Pure module — no server imports — safe in client and server components.
 */
import type { Stage, Milestone } from "@/types";
import { STAGE_CONFIG } from "@/types";
import { CUSTOMER_PHASES } from "@/lib/event-access";

/** Which lifecycle phase each stage belongs to. */
const STAGE_TO_PHASE: Record<Stage, string> = {
  confirmed: "create",
  kickoff_complete: "create",
  creative_assets: "create",
  approvals: "create",
  build_configuration: "prepare",
  qa_readiness: "prepare",
  logistics_confirmed: "prepare",
  event_live: "event-day",
  reporting: "results",
  complete: "results",
};

export interface PhasePosition {
  id: string;
  label: string;
  /** Zero-based index of this phase in the lifecycle. */
  index: number;
  /** Total number of phases. */
  total: number;
}

/** The lifecycle phase a stage sits in, with its index for "phase N of M". */
export function phaseForStage(stage: Stage): PhasePosition {
  const id = STAGE_TO_PHASE[stage];
  const index = CUSTOMER_PHASES.findIndex((p) => p.id === id);
  const safeIndex = index === -1 ? 0 : index;
  return {
    id,
    label: CUSTOMER_PHASES[safeIndex].label,
    index: safeIndex,
    total: CUSTOMER_PHASES.length,
  };
}

export type JourneyPhaseState = "done" | "current" | "upcoming";

export interface JourneyMilestone {
  id: string;
  label: string;
  owner: "you" | "brightblue";
  status: "done" | "active" | "upcoming";
  targetDate?: string;
}

export interface JourneyPhase {
  id: string;
  label: string;
  state: JourneyPhaseState;
  /** Stages that make up this phase, in order. */
  stages: Stage[];
  milestones: JourneyMilestone[];
}

const ALL_STAGES = Object.keys(STAGE_CONFIG) as Stage[];

/** Stages belonging to a phase, ordered by their canonical stage order. */
function stagesForPhase(phaseId: string): Stage[] {
  return ALL_STAGES.filter((s) => STAGE_TO_PHASE[s] === phaseId).sort(
    (a, b) => STAGE_CONFIG[a].order - STAGE_CONFIG[b].order,
  );
}

/**
 * Milestone owner heuristic. Bright.Blue owns the delivery machinery; the
 * customer owns creative sign-off and inputs. We infer from the milestone's
 * stage: creative/approval stages lean customer, everything else is us.
 */
function ownerForMilestone(m: Milestone): "you" | "brightblue" {
  if (m.stage === "approvals" || m.stage === "creative_assets") return "you";
  return "brightblue";
}

/**
 * Build the four-phase journey for an event: which phases are done, which is
 * current, and the milestone chips within each (with customer-safe owner
 * labels). Used by the shared EventJourney component across every role.
 */
export function buildJourney(
  currentStage: Stage,
  milestones: Milestone[],
): { phases: JourneyPhase[]; current: PhasePosition } {
  const current = phaseForStage(currentStage);
  const currentOrder = STAGE_CONFIG[currentStage].order;

  const phases: JourneyPhase[] = CUSTOMER_PHASES.map((phase, i) => {
    const stages = stagesForPhase(phase.id);
    const state: JourneyPhaseState =
      i < current.index ? "done" : i === current.index ? "current" : "upcoming";

    const phaseMilestones: JourneyMilestone[] = milestones
      .filter((m) => STAGE_TO_PHASE[m.stage] === phase.id)
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((m) => {
        const stageOrder = STAGE_CONFIG[m.stage].order;
        const status: JourneyMilestone["status"] =
          m.status === "complete"
            ? "done"
            : stageOrder === currentOrder
              ? "active"
              : stageOrder < currentOrder
                ? "done"
                : "upcoming";
        return {
          id: m.id,
          label: m.name,
          owner: ownerForMilestone(m),
          status,
          targetDate: m.targetDate,
        };
      });

    return { id: phase.id, label: phase.label, state, stages, milestones: phaseMilestones };
  });

  return { phases, current };
}
/**
 * True when `stage` is at or beyond `threshold` in the canonical lifecycle
 * order. Used for stage-gated behaviour — e.g. once an event reaches
 * `logistics_confirmed`, the ops team has planned against the customer's
 * details, so those inputs "soft-lock" (edits become a change request rather
 * than a silent overwrite).
 */
export function isStageAtOrAfter(stage: Stage, threshold: Stage): boolean {
  return STAGE_CONFIG[stage].order >= STAGE_CONFIG[threshold].order;
}

/**
 * The next milestone the customer will own that isn't done yet, in journey
 * order. Powers the forward-looking "Next up..." preview in the customer's
 * "all clear" state, so a quiet moment never reads as "finished forever".
 * Returns null when the customer has no remaining milestones.
 */
export function nextCustomerMilestone(
  currentStage: Stage,
  milestones: Milestone[],
): { label: string; targetDate?: string } | null {
  const { phases } = buildJourney(currentStage, milestones);
  for (const phase of phases) {
    for (const m of phase.milestones) {
      if (m.owner === "you" && m.status !== "done") {
        return { label: m.label, targetDate: m.targetDate };
      }
    }
  }
  return null;
}
