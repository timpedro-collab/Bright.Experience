/**
 * One-shot codemod: call logQueryError() at every read helper that swallows a
 * Supabase error and degrades to empty data. Kept in the repo so the same pass
 * can be re-run over new query files. Review the diff — it is mechanical.
 *
 * Usage: node scripts/wire-log-query-error.mjs [--dry] [glob...]
 */
import { readFileSync, writeFileSync } from "node:fs";
import { globSync } from "node:fs";

const args = process.argv.slice(2);
const dry = args.includes("--dry");
const patterns = args.filter((a) => !a.startsWith("--"));
const files = globSync(
  patterns.length ? patterns : ["src/lib/queries/*.ts"]
).filter((f) => !f.endsWith(".test.ts"));

const FN_DECL =
  /^\s*(?:export\s+)?(?:async\s+)?function\s+([A-Za-z0-9_]+)\s*\(([^)]*)/;

/** Nearest enclosing function name + a plausible id parameter for context. */
function enclosing(lines, index) {
  for (let i = index; i >= 0; i--) {
    const m = lines[i].match(FN_DECL);
    if (!m) continue;
    const name = m[1];
    // Signatures can wrap; collect until the closing paren for parameter names.
    let sig = lines.slice(i, Math.min(i + 8, lines.length)).join(" ");
    sig = sig.slice(sig.indexOf("(") + 1, sig.indexOf(")") + 1);
    const idParam = sig
      .split(",")
      .map((p) => p.trim().split(/[:?=)]/)[0].trim())
      .find((p) => /^[a-z][A-Za-z0-9]*(Id|Slug|Token|Key)$|^(id|slug|token)$/.test(p));
    return { name, idParam };
  }
  return null;
}

function contextArg(idParam) {
  return idParam ? `, { ${idParam} }` : "";
}

let changedFiles = 0;
let sites = 0;

for (const file of files) {
  const src = readFileSync(file, "utf8");
  const lines = src.split("\n");
  const out = [];
  let touched = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const indentMatch = line.match(/^(\s*)/);
    const indent = indentMatch ? indentMatch[1] : "";
    const guard = line.match(/^\s*if \(error(?: \|\| !data)?\)\s*(.*)$/);

    if (!guard) {
      out.push(line);
      continue;
    }

    const fn = enclosing(lines, i);
    if (!fn) {
      out.push(line);
      continue;
    }
    const call = `${indent}  logQueryError("${fn.name}", error${contextArg(fn.idParam)});`;
    const tail = guard[1].trim();

    if (tail === "{") {
      // Already a block. Replace an existing console.error, else prepend.
      const next = lines[i + 1] ?? "";
      out.push(line);
      if (/^\s*console\.error\(/.test(next)) {
        // Multi-line console.error calls end on the line closing the paren.
        let j = i + 1;
        let depth = 0;
        do {
          depth += (lines[j].match(/\(/g) ?? []).length;
          depth -= (lines[j].match(/\)/g) ?? []).length;
          j++;
        } while (depth > 0 && j < lines.length);
        out.push(call);
        i = j - 1;
      } else {
        out.push(call);
      }
      touched = true;
      sites++;
      continue;
    }

    if (tail.startsWith("return")) {
      // Single-statement guard: wrap it so the log sits alongside the return.
      const condition = line.trim().replace(/\s*return.*$/, "");
      out.push(`${indent}${condition} {`);
      out.push(call);
      out.push(`${indent}  ${tail}`);
      out.push(`${indent}}`);
      touched = true;
      sites++;
      continue;
    }

    out.push(line);
  }

  if (!touched) continue;

  let result = out.join("\n");
  if (!result.includes('from "@/lib/observability/log-query-error"')) {
    const importLine =
      'import { logQueryError } from "@/lib/observability/log-query-error";';
    const lastImport = result.lastIndexOf("\nimport ");
    if (lastImport === -1) {
      result = `${importLine}\n${result}`;
    } else {
      const endOfImport = result.indexOf("\n", result.indexOf(";", lastImport));
      result = `${result.slice(0, endOfImport)}\n${importLine}${result.slice(endOfImport)}`;
    }
  }

  changedFiles++;
  if (!dry) writeFileSync(file, result);
}

console.log(
  `${dry ? "[dry] " : ""}wired ${sites} swallow sites across ${changedFiles} files`
);
