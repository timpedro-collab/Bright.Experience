/**
 * Canonical notification archetypes — the dispatch table for the spine.
 *
 * Every domain event that wants to notify someone declares its archetype in
 * one of the `./catalogue.*` section modules. The dispatcher (`../dispatch.ts`)
 * and the reminder cron read from this catalogue rather than each callsite
 * hand-rolling its own copy. That keeps subject lines, body copy, links, owner
 * rules, and reminder cadence in one place.
 *
 * Two classes of archetypes:
 *   - `action_required` (Class A): project-critical. The in-portal lane is
 *     always-on at the application layer regardless of stored preferences,
 *     and the reminder cron overrides `email_mode: "off"` after 48h.
 *   - `fyi` (Class B): informational. Both lanes are fully opt-outable per
 *     `notification_preferences`.
 *
 * Owner resolution is intentionally NOT here — each archetype names its
 * resolver and `../resolve-owners.ts` provides the pure function, so the
 * resolver can hit the database without making this catalogue async.
 *
 * The `Record<NotificationKind, Archetype>` annotation on `ARCHETYPES` forces
 * exhaustiveness: add a `NotificationKind` without a catalogue row and the
 * build fails here.
 */

import type { Archetype, NotificationKind } from "./types";
import { customerArchetypes } from "./catalogue.customer";
import { internalArchetypes } from "./catalogue.internal";
import { lifecycleArchetypes } from "./catalogue.lifecycle";
import { operationsArchetypes } from "./catalogue.operations";

export type {
  Archetype,
  ArchetypeSection,
  NotificationKind,
  NotificationClass,
  NotificationPriority,
  OwnerResolverKey,
  ReminderCadence,
} from "./types";

export const ARCHETYPES: Record<NotificationKind, Archetype> = {
  ...customerArchetypes,
  ...internalArchetypes,
  ...lifecycleArchetypes,
  ...operationsArchetypes,
};

/** Convenience: the lookup any consumer should use. */
export function getArchetype(kind: NotificationKind): Archetype {
  return ARCHETYPES[kind];
}

/**
 * Render `{token}` placeholders using a flat context object. Missing
 * tokens collapse to empty strings — better a slightly bland email than a
 * crashed dispatch.
 */
export function fillTemplate(
  template: string,
  context: Record<string, string | number | null | undefined>
): string {
  return template.replace(/\{(\w+)\}/g, (_match, key: string) => {
    const value = context[key];
    if (value === null || value === undefined) return "";
    return String(value);
  });
}

/**
 * Class A archetypes — useful for the dispatcher and the preferences UI to
 * loop over without having to filter the catalogue.
 */
export const CLASS_A_KINDS: NotificationKind[] = Object.values(ARCHETYPES)
  .filter((a) => a.classOf === "action_required")
  .map((a) => a.kind);

export const CLASS_B_KINDS: NotificationKind[] = Object.values(ARCHETYPES)
  .filter((a) => a.classOf === "fyi")
  .map((a) => a.kind);
