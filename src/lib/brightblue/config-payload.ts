/**
 * Event configuration payload for the machine stack.
 *
 * INTEGRATION: Bright.Blue Cloud (outbound config sync)
 *
 * The portal is the source of truth for how a machine behaves at an event —
 * game setup, prize plan, capture form, and the capture-quality guardrails
 * (business-emails-only, duplicate blocking, GDPR consent). This module
 * assembles the versioned JSON contract the machine stack consumes; the push
 * itself lives in `./client.ts` (`pushEventConfig`).
 *
 * Version 2 adds a `machines[]` array so one show can drive a fleet running
 * different jobs per unit. Each entry is fully resolved (the machine's own
 * configuration if it has one, otherwise the show default), so the machine
 * stack never has to implement inheritance. The top-level `game` and
 * `capture_rules` blocks remain the show-wide default and are unchanged from
 * version 1, which keeps single-machine consumers working during rollout.
 *
 * Contract doc: docs/10-integrations.md §1b (machine config sync).
 */

// Type-only import from the actions module (safe with "use server" files).
import type {
  PrizeMode,
  PrizeEntry,
  FormFieldEntry,
  CaptureMethod,
} from "@/app/actions/game-config";
import type { CaptureRules } from "@/lib/capture-rules";
import type { MachineMission } from "@/types";
import { resolveConfigForMachine, type FleetMachine } from "@/lib/configuration/resolve-config";

/** Game + capture behaviour, shared by the show-wide block and each machine. */
interface GameBlock {
  prize_mode: PrizeMode;
  prizes: { name: string; image_url?: string; quantity: number; probability?: number }[];
  form_fields: { label: string; type: FormFieldEntry["type"]; required: boolean; options?: string[] }[];
  leaderboard_enabled: boolean;
  game_parameters: Record<string, unknown>;
  idle_screen: Record<string, unknown>;
}

interface CaptureRulesBlock {
  business_emails_only: boolean;
  blocked_domains: string[];
  block_duplicates: boolean;
  consent_required: boolean;
  consent_text: string;
}

/** One deployed unit and the fully-resolved configuration it should run. */
export interface MachineConfigBlock {
  machine_instance_id: string;
  serial_number: string;
  /** Free-text venue location, e.g. "Registration" or "Hall 3 entrance". */
  zone: string | null;
  mission: MachineMission | null;
  /** How a play is unlocked: form entry, badge scan, or either. */
  capture_method: CaptureMethod;
  /** True when this unit diverges from the show-wide default. */
  is_override: boolean;
  game: GameBlock;
  capture_rules: CaptureRulesBlock;
  retention_days: number;
  branded_landing: boolean;
}

/** Wire shape (snake_case) the machine stack receives. Bump `version` on breaking changes. */
export interface EventConfigPayload {
  version: 2;
  event_id: string;
  pushed_at: string;
  game: GameBlock;
  capture_rules: CaptureRulesBlock;
  retention_days: number;
  branded_landing: boolean;
  capture_method: CaptureMethod;
  /** Empty for a single-machine activation with no fleet assigned. */
  machines: MachineConfigBlock[];
}

/** The portal-side (camelCase) configuration the payload is assembled from. */
export interface EventConfigInput {
  prizeMode: PrizeMode;
  prizesJson: PrizeEntry[];
  formFieldsJson: FormFieldEntry[];
  leaderboardEnabled: boolean;
  gameParametersJson: Record<string, unknown>;
  idleScreenConfigJson: Record<string, unknown>;
  captureRulesJson: CaptureRules;
  retentionDays: number;
  brandedLanding: boolean;
  captureMethod?: CaptureMethod;
  /** Null for the show-wide default; set on a per-machine override row. */
  machineInstanceId?: string | null;
}

function buildGameBlock(config: EventConfigInput): GameBlock {
  return {
    prize_mode: config.prizeMode,
    prizes: config.prizesJson.map((p) => ({
      name: p.name,
      ...(p.imageUrl ? { image_url: p.imageUrl } : {}),
      quantity: p.quantity,
      ...(p.probability != null ? { probability: p.probability } : {}),
    })),
    form_fields: config.formFieldsJson.map((f) => ({
      label: f.label,
      type: f.type,
      required: f.required,
      ...(f.options ? { options: f.options } : {}),
    })),
    leaderboard_enabled: config.leaderboardEnabled,
    game_parameters: config.gameParametersJson,
    idle_screen: config.idleScreenConfigJson,
  };
}

function buildCaptureRulesBlock(config: EventConfigInput): CaptureRulesBlock {
  return {
    business_emails_only: config.captureRulesJson.businessEmailsOnly,
    blocked_domains: config.captureRulesJson.blockedDomains,
    block_duplicates: config.captureRulesJson.blockDuplicates,
    consent_required: config.captureRulesJson.consentRequired,
    consent_text: config.captureRulesJson.consentText,
  };
}

/**
 * Assemble the machine config contract from a show's saved configurations.
 * Pure — the caller decides when (submit) and how (fire-and-forget) to push.
 *
 * @param eventId   The show being configured.
 * @param config    The show-wide default configuration.
 * @param fleet     Machines deployed to the show. Omit for a single-machine
 *                  activation; `machines[]` is then empty and the payload is
 *                  read exactly as version 1 was.
 * @param overrides Machine-scoped configuration rows, if any.
 */
export function buildEventConfigPayload(
  eventId: string,
  config: EventConfigInput,
  fleet: FleetMachine[] = [],
  overrides: EventConfigInput[] = [],
  pushedAt: Date = new Date()
): EventConfigPayload {
  // The default row participates in resolution, so a machine with no override
  // inherits it rather than resolving to nothing.
  const scopedRows: EventConfigInput[] = [
    { ...config, machineInstanceId: config.machineInstanceId ?? null },
    ...overrides,
  ];

  return {
    version: 2,
    event_id: eventId,
    pushed_at: pushedAt.toISOString(),
    game: buildGameBlock(config),
    capture_rules: buildCaptureRulesBlock(config),
    retention_days: config.retentionDays,
    branded_landing: config.brandedLanding,
    capture_method: config.captureMethod ?? "form",
    machines: fleet.map((machine) => {
      const resolved =
        resolveConfigForMachine(
          scopedRows as (EventConfigInput & { machineInstanceId: string | null })[],
          machine.id
        ) ?? config;
      return {
        machine_instance_id: machine.id,
        serial_number: machine.serialNumber,
        zone: machine.zone ?? null,
        mission: machine.mission ?? null,
        capture_method: resolved.captureMethod ?? "form",
        is_override: overrides.some((o) => o.machineInstanceId === machine.id),
        game: buildGameBlock(resolved),
        capture_rules: buildCaptureRulesBlock(resolved),
        retention_days: resolved.retentionDays,
        branded_landing: resolved.brandedLanding,
      };
    }),
  };
}
