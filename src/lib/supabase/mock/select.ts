/**
 * A small PostgREST `select` grammar parser + projector for the mock client.
 *
 * Handles the patterns the app actually uses:
 *   - plain columns and `*`
 *   - one-level embeds:   `accounts(name)`
 *   - aliased embeds:     `owner:profiles(id, name)`
 *   - aliased FK embeds:  `uploader:profiles!assets_uploaded_by_fkey(name)`
 *   - inner-join embeds:  `accounts!inner(name)`
 *   - nested embeds:      `machine_games ( games ( id, name ) )`
 *   - embedded counts:    `tasks(count)`
 *
 * Projection is permissive: it always returns the FULL parent row (so no
 * consumer loses a field it expects) and adds the embedded relation keys on top.
 */

import { getRelation } from "./relationships";
import type { MockRow } from "./store";

export interface Field {
  kind: "col" | "embed";
  name: string;
  alias?: string;
  hint?: string;
  count?: boolean;
  children?: Field[];
}

export function parseSelect(input: string): Field[] {
  const fields: Field[] = [];
  for (const part of splitTop(input)) {
    const token = part.trim();
    if (!token) continue;
    const paren = token.indexOf("(");
    if (paren === -1) {
      const [alias, name] = splitAlias(token);
      fields.push({ kind: "col", name, alias });
    } else {
      const head = token.slice(0, paren).trim();
      const inner = token.slice(paren + 1, token.lastIndexOf(")"));
      const [alias, relspec] = splitAlias(head);
      let relation = relspec;
      let hint: string | undefined;
      const bang = relspec.indexOf("!");
      if (bang !== -1) {
        relation = relspec.slice(0, bang).trim();
        hint = relspec.slice(bang + 1).trim();
      }
      if (inner.trim() === "count") {
        fields.push({ kind: "embed", name: relation, alias, hint, count: true });
      } else {
        fields.push({ kind: "embed", name: relation, alias, hint, children: parseSelect(inner) });
      }
    }
  }
  return fields;
}

function splitAlias(s: string): [string | undefined, string] {
  const i = s.indexOf(":");
  if (i === -1) return [undefined, s.trim()];
  return [s.slice(0, i).trim(), s.slice(i + 1).trim()];
}

function splitTop(s: string): string[] {
  const out: string[] = [];
  let depth = 0;
  let cur = "";
  for (const ch of s) {
    if (ch === "(") {
      depth++;
      cur += ch;
    } else if (ch === ")") {
      depth--;
      cur += ch;
    } else if (ch === "," && depth === 0) {
      out.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  if (cur.trim()) out.push(cur);
  return out;
}

// When a profiles embed's declared FK column isn't present on the row, try
// these common identity columns so the embed still resolves.
const PROFILE_FK_CANDIDATES = [
  "user_id",
  "profile_id",
  "member_id",
  "created_by",
  "assigned_to",
  "author_id",
  "sender_id",
  "actor_id",
  "uploaded_by",
  "requested_by",
  "decided_by",
];

export function projectRow(
  parentTable: string,
  row: MockRow,
  fields: Field[],
  getTable: (n: string) => MockRow[],
): MockRow {
  const out: MockRow = { ...row };

  const embeds = fields.filter((f) => f.kind === "embed");
  // Honor plain column aliases (rare) without dropping any fields.
  for (const f of fields) {
    if (f.kind === "col" && f.alias) out[f.alias] = row[f.name];
  }
  if (embeds.length === 0) return out;

  for (const f of embeds) {
    const key = f.alias ?? f.name;
    const spec = getRelation(parentTable, f.name, f.hint);
    if (!spec) {
      out[key] = f.count ? [{ count: 0 }] : null;
      continue;
    }

    const foreignRows = getTable(spec.foreignTable);

    if (spec.toMany) {
      const matches = foreignRows.filter((r) => r[spec.foreignKey] === row[spec.localKey]);
      if (f.count) {
        out[key] = [{ count: matches.length }];
      } else {
        out[key] = matches.map((r) => projectRow(spec.foreignTable, r, f.children ?? [], getTable));
      }
    } else {
      let localVal = row[spec.localKey];
      if (localVal == null && spec.foreignTable === "profiles") {
        for (const c of PROFILE_FK_CANDIDATES) {
          if (row[c] != null) {
            localVal = row[c];
            break;
          }
        }
      }
      const match = localVal == null ? null : foreignRows.find((r) => r[spec.foreignKey] === localVal) ?? null;
      out[key] = match ? projectRow(spec.foreignTable, match, f.children ?? [], getTable) : null;
    }
  }
  return out;
}
