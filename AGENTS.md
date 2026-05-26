<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Testing is part of the workflow

This codebase has a comprehensive test suite (Vitest + Testing Library + Playwright + pgTAP). Treat tests as a first-class artefact, never an afterthought.

## Hard rules

1. **Every new pure helper in `src/lib/` must ship with a `*.test.ts` next to it.** No exceptions.
2. **Every new server action in `src/app/actions/` must ship with at least a happy-path test.** Branch-heavy actions (auth, validation, dispatch) need a test per branch.
3. **Every new RLS policy must ship with a pgTAP file** under `supabase/tests/` that fails when the policy is broken.
4. **Every new client component with interactivity** (`onClick`, form state, optimistic updates) gets a Testing Library spec.
5. **Never drop coverage** below the thresholds in `vitest.config.ts`. If a refactor legitimately needs the threshold lowered, call it out in the commit message.
6. **Tests live next to source** — `foo.ts` and `foo.test.ts` in the same folder. Not under `__tests__/`.

## Run before declaring "done"

```bash
npm run lint
npm run typecheck
npm test
```

These three must be green before claiming a task is complete. RLS and E2E tests (`npm run test:rls`, `npm run test:e2e`) require Docker / a Playwright install but are part of CI.

## See

- `docs/testing.md` for full conventions, templates, and how to write a new test.
- `CONTRIBUTING.md` for the human onboarding flow.
- `.cursor/rules/testing.mdc` for the Cursor-specific enforcement.
