/**
 * Relationship registry for resolving PostgREST embedded selects against the
 * in-memory dataset (e.g. `events(name)`, `uploader:profiles!fk(name)`,
 * `machine_games ( games ( ... ) )`).
 *
 * Each spec says how to walk from a parent row to its related row(s):
 *   - localKey:    column on the parent
 *   - foreignTable + foreignKey: the related table and its matching column
 *   - toMany:      false → single nested object, true → array of objects
 */

export interface RelSpec {
  localKey: string;
  foreignTable: string;
  foreignKey: string;
  toMany: boolean;
}

// FK column → the table it points at (for inferred embeds like
// `machines:machine_type_id(slug)`).
const FK_COLUMN_TABLE: Record<string, string> = {
  machine_type_id: "machines",
  machine_id: "machines",
  game_id: "games",
  account_id: "accounts",
  event_id: "events",
  venue_id: "venues",
  partner_id: "partners",
  profile_id: "profiles",
  package_id: "packages",
  asset_id: "assets",
  quote_id: "quotes",
  campaign_id: "campaigns",
  machine_instance_id: "machine_instances",
  placement_id: "placements",
};

// Explicit relationships keyed `${parentTable}:${relationName}`.
const REL: Record<string, RelSpec> = {
  "events:accounts": { localKey: "account_id", foreignTable: "accounts", foreignKey: "id", toMany: false },
  "events:tasks": { localKey: "id", foreignTable: "tasks", foreignKey: "event_id", toMany: true },
  "invoices:events": { localKey: "event_id", foreignTable: "events", foreignKey: "id", toMany: false },
  "invoices:accounts": { localKey: "account_id", foreignTable: "accounts", foreignKey: "id", toMany: false },
  "studio_requests:events": { localKey: "event_id", foreignTable: "events", foreignKey: "id", toMany: false },
  "assets:events": { localKey: "event_id", foreignTable: "events", foreignKey: "id", toMany: false },
  "tasks:events": { localKey: "event_id", foreignTable: "events", foreignKey: "id", toMany: false },
  "notifications:events": { localKey: "event_id", foreignTable: "events", foreignKey: "id", toMany: false },
  "machines:machine_games": { localKey: "id", foreignTable: "machine_games", foreignKey: "machine_id", toMany: true },
  "machine_games:games": { localKey: "game_id", foreignTable: "games", foreignKey: "id", toMany: false },
  "machine_games:machines": { localKey: "machine_id", foreignTable: "machines", foreignKey: "id", toMany: false },
  "machines:packages": { localKey: "id", foreignTable: "packages", foreignKey: "machine_id", toMany: true },
  "games:machine_games": { localKey: "id", foreignTable: "machine_games", foreignKey: "game_id", toMany: true },
  "packages:package_addons": { localKey: "id", foreignTable: "package_addons", foreignKey: "package_id", toMany: true },
  "packages:machines": { localKey: "machine_id", foreignTable: "machines", foreignKey: "id", toMany: false },
  "campaigns:campaign_events": { localKey: "id", foreignTable: "campaign_events", foreignKey: "campaign_id", toMany: true },
  "campaign_events:events": { localKey: "event_id", foreignTable: "events", foreignKey: "id", toMany: false },
  "campaign_events:campaigns": { localKey: "campaign_id", foreignTable: "campaigns", foreignKey: "id", toMany: false },
  "partners:partner_users": { localKey: "id", foreignTable: "partner_users", foreignKey: "partner_id", toMany: true },
  "partner_users:partners": { localKey: "partner_id", foreignTable: "partners", foreignKey: "id", toMany: false },
  "partner_users:profiles": { localKey: "profile_id", foreignTable: "profiles", foreignKey: "id", toMany: false },
  "placements:machine_instances": { localKey: "machine_instance_id", foreignTable: "machine_instances", foreignKey: "id", toMany: false },
  "placements:venues": { localKey: "venue_id", foreignTable: "venues", foreignKey: "id", toMany: false },
  "sponsorship_slots:placements": { localKey: "placement_id", foreignTable: "placements", foreignKey: "id", toMany: false },
  "sponsorship_slots:venues": { localKey: "venue_id", foreignTable: "venues", foreignKey: "id", toMany: false },
  "event_team_members:profiles": { localKey: "profile_id", foreignTable: "profiles", foreignKey: "id", toMany: false },
  "machine_instances:machines": { localKey: "machine_type_id", foreignTable: "machines", foreignKey: "id", toMany: false },
};

export function getRelation(
  parentTable: string,
  relation: string,
  hint?: string,
): RelSpec | null {
  // Aliased FK embed: `alias:profiles!owner_table_col_fkey(...)`.
  // The constraint name encodes `${ownerTable}_${column}_fkey`; the owner is
  // the parent in every case we use, so strip the parent prefix to get the col.
  if (hint && hint !== "inner") {
    const core = hint.replace(/_fkey$/, "");
    let col = core;
    if (core.startsWith(parentTable + "_")) col = core.slice(parentTable.length + 1);
    return { localKey: col, foreignTable: relation, foreignKey: "id", toMany: false };
  }

  const direct = REL[`${parentTable}:${relation}`];
  if (direct) return direct;

  // Inferred FK-column embed, e.g. `machines:machine_type_id(slug)`.
  if (relation.endsWith("_id") && FK_COLUMN_TABLE[relation]) {
    return { localKey: relation, foreignTable: FK_COLUMN_TABLE[relation], foreignKey: "id", toMany: false };
  }

  return null;
}
