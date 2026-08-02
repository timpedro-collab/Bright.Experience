/**
 * find-dead-exports — lists exported symbols nothing else imports.
 *
 * Not a linter and not run in CI: a reporting aid for cleanup passes. It reads
 * every module under `src/`, collects exported names, then counts where each
 * name appears as an identifier token anywhere else in the tree. Anything that
 * only ever appears in the file that declares it (or only in that file's own
 * test) is reported.
 *
 * Framework entry points are excluded, because Next.js imports them by
 * convention rather than by name: `page`/`layout`/`route` files, `middleware`,
 * `instrumentation`, and the shadcn primitives under `components/ui`.
 *
 * Types are excluded unless `--include-types` is passed. `src/types/**` is a
 * deliberate full mirror of the database schema — it documents the data model
 * for anyone reading the code, so a table's type staying around after the last
 * consumer moves on is intentional, not rot.
 *
 * Two results need different fixes, so check before deleting: a symbol used
 * inside its own module is over-exported (drop the `export`), while one that
 * appears nowhere else at all is dead (delete it).
 *
 *   node scripts/find-dead-exports.mjs [--include-ui] [--include-types] [--json]
 */

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, basename } from "node:path";
import ts from "typescript";

const ROOT = process.cwd();
const SRC = join(ROOT, "src");
const args = new Set(process.argv.slice(2));

const FRAMEWORK_FILES = new Set([
  "page.tsx",
  "layout.tsx",
  "route.ts",
  "error.tsx",
  "loading.tsx",
  "not-found.tsx",
  "global-error.tsx",
  "default.tsx",
  "template.tsx",
  "opengraph-image.tsx",
  "sitemap.ts",
  "robots.ts",
  "middleware.ts",
  "instrumentation.ts",
  "instrumentation-client.ts",
]);

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (/\.tsx?$/.test(full)) out.push(full);
  }
  return out;
}

const files = walk(SRC);
const sources = new Map();
for (const file of files) {
  sources.set(file, readFileSync(file, "utf8"));
}

/** Every exported name in a file, excluding default exports. */
function exportedNames(file, text) {
  const sf = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true);
  const names = [];
  const isExported = (node) =>
    node.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword);

  for (const node of sf.statements) {
    if (!isExported(node)) continue;
    if (node.modifiers?.some((m) => m.kind === ts.SyntaxKind.DefaultKeyword)) continue;
    const typeOnly =
      ts.isTypeAliasDeclaration(node) || ts.isInterfaceDeclaration(node);
    if (ts.isVariableStatement(node)) {
      for (const decl of node.declarationList.declarations) {
        if (ts.isIdentifier(decl.name)) names.push({ name: decl.name.text, typeOnly });
      }
    } else if (node.name && ts.isIdentifier(node.name)) {
      names.push({ name: node.name.text, typeOnly });
    }
  }
  return names;
}

const declarations = new Map(); // name -> [files]
for (const [file, text] of sources) {
  const name = basename(file);
  if (FRAMEWORK_FILES.has(name)) continue;
  if (name.includes(".test.")) continue;
  if (!args.has("--include-ui") && file.includes("/components/ui/")) continue;
  for (const exported of exportedNames(file, text)) {
    if (!declarations.has(exported.name)) declarations.set(exported.name, []);
    declarations.get(exported.name).push({ file, typeOnly: exported.typeOnly });
  }
}

/** Files in which a bare identifier token appears. */
const usage = new Map();
for (const [file, text] of sources) {
  const sf = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true);
  const seen = new Set();
  const visit = (node) => {
    if (ts.isIdentifier(node)) seen.add(node.text);
    ts.forEachChild(node, visit);
  };
  ts.forEachChild(sf, visit);
  for (const name of seen) {
    if (!usage.has(name)) usage.set(name, new Set());
    usage.get(name).add(file);
  }
}

const dead = [];
for (const [name, declaredIn] of declarations) {
  if (declaredIn.length > 1) continue; // ambiguous name, skip rather than guess
  const [{ file, typeOnly }] = declaredIn;
  if (typeOnly && !args.has("--include-types")) continue;
  const elsewhere = [...(usage.get(name) ?? [])].filter((f) => f !== file);
  const nonTest = elsewhere.filter((f) => !basename(f).includes(".test."));
  if (nonTest.length === 0) {
    dead.push({
      name,
      file: relative(ROOT, file),
      typeOnly,
      testOnly: elsewhere.length > 0,
    });
  }
}

dead.sort((a, b) => a.file.localeCompare(b.file) || a.name.localeCompare(b.name));

if (args.has("--json")) {
  console.log(JSON.stringify(dead, null, 2));
} else {
  for (const item of dead) {
    console.log(`${item.file}  ${item.name}${item.testOnly ? "  (test-only)" : ""}`);
  }
  console.log(`\n${dead.length} exports with no importer.`);
}
