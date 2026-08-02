# 00 — Documentation Index

> **Version:** 0.1.0 · **Status:** current · **Owner:** Platform / CTO ·
> **Last verified:** 2026-07-25 against the code on `main`.
>
> This is the canonical entry point to the Bright.Experience documentation
> suite. Start here, then follow the path for your role.

Bright.Experience is Bright.Blue's delivery-and-proof portal for experiential
activations: one workspace to run an event from kickoff, through live
telemetry, to post-event proof of performance. Public catalog, quiz, and
quoting are the intake path that feeds delivery; partner and venue portals are
secondary growth surfaces.

## Read this first

| You are… | Start with | Then read |
|----------|-----------|-----------|
| A **non-technical stakeholder** | [`README.md`](../README.md) | [`docs/01-product-definition.md`](01-product-definition.md), [`docs/17-feature-reference.md`](17-feature-reference.md) |
| A **new engineer** | [`SETUP.md`](../SETUP.md) | [`docs/14-codebase-map.md`](14-codebase-map.md), [`docs/15-system-architecture.md`](15-system-architecture.md), [`CONTRIBUTING.md`](../CONTRIBUTING.md) |
| An **incoming CTO / tech lead** | [`HANDOFF.md`](../HANDOFF.md) | [`docs/13-dev-handover-priorities.md`](13-dev-handover-priorities.md), [`docs/11-cloud-handoff.md`](11-cloud-handoff.md) |
| An **operator / SRE** | [`docs/ops/README.md`](ops/README.md) | [`docs/10-integrations.md`](10-integrations.md), [`docs/16-api-and-actions-reference.md`](16-api-and-actions-reference.md) |
| A **product owner** | [`docs/17-feature-reference.md`](17-feature-reference.md) | [`docs/08-pricing-and-quoting-model.md`](08-pricing-and-quoting-model.md), [`OWNER-TODO.md`](../OWNER-TODO.md) |

## The full map

### Onboarding and governance (repo root)

| Doc | Purpose |
|-----|---------|
| [`README.md`](../README.md) | What the system is, capability map, production boundaries, entry links |
| [`SETUP.md`](../SETUP.md) | Three tested setup paths: mock demo, local Supabase, hosted Supabase |
| [`HANDOFF.md`](../HANDOFF.md) | Day-1 orientation for the incoming CTO |
| [`CONTRIBUTING.md`](../CONTRIBUTING.md) | Contribution flow, conventions, PR checklist |
| [`CHANGELOG.md`](../CHANGELOG.md) | What shipped, when |
| [`STUBS-TO-REPLACE.md`](../STUBS-TO-REPLACE.md) | Intentional launch stubs and their replacement owners |
| [`OWNER-TODO.md`](../OWNER-TODO.md) | Non-dev business decisions (pricing, legal, accounts) |
| [`DEMO_ROADMAP.md`](../DEMO_ROADMAP.md) | Live demo script |

### Product and design (`docs/01`–`docs/09`, `docs/12`)

| Doc | Purpose |
|-----|---------|
| [`01-product-definition.md`](01-product-definition.md) | Positioning, audiences, success criteria |
| [`02-event-lifecycle.md`](02-event-lifecycle.md) | The 10-stage delivery pipeline and gates |
| [`03-roles-permissions.md`](03-roles-permissions.md) | RBAC model (mirrors `src/lib/roles.ts`) |
| [`04-data-model.md`](04-data-model.md) | Core entities and fields |
| [`05-information-architecture.md`](05-information-architecture.md) | Route map and navigation (mirrors the real route tree) |
| [`06-build-roadmap.md`](06-build-roadmap.md) | Phased delivery history |
| [`07-platform-vision.md`](07-platform-vision.md) | Longer-term catalog / partner / venue vision |
| [`08-pricing-and-quoting-model.md`](08-pricing-and-quoting-model.md) | Implemented two-track quoting + capability model |
| [`09-design-system.md`](09-design-system.md) | The Cloud design language and banned patterns |
| [`12-ux-simplification-audit.md`](12-ux-simplification-audit.md) | Role-by-role UX audit (historical, resolved) |

### Architecture, integrations, and reference (`docs/10`, `docs/11`, `docs/14`–`docs/17`)

| Doc | Purpose |
|-----|---------|
| [`10-integrations.md`](10-integrations.md) | Webhooks, crons, and every external system |
| [`11-cloud-handoff.md`](11-cloud-handoff.md) | Authoritative full schema + Cloud provisioning register |
| [`13-dev-handover-priorities.md`](13-dev-handover-priorities.md) | Prioritised dev worklist + security checklist |
| [`14-codebase-map.md`](14-codebase-map.md) | Directory taxonomy, entry points, tooling, inventories |
| [`15-system-architecture.md`](15-system-architecture.md) | Architecture and data-flow diagrams |
| [`16-api-and-actions-reference.md`](16-api-and-actions-reference.md) | Route handlers + server-action reference |
| [`17-feature-reference.md`](17-feature-reference.md) | Role-based feature catalogue → implementation |
| [`18-design-research.md`](18-design-research.md) | Competitive design/UX teardown → graded homepage + portal proposals |
| [`19-market-ecosystem-research.md`](19-market-ecosystem-research.md) | Deep-dive market/ecosystem research (~110 orgs) → gap analysis, messaging architecture, phased build plan; raw evidence in [`research/2026-08-market/`](research/2026-08-market/) |

### Operations runbooks (`docs/ops/`)

| Doc | Purpose |
|-----|---------|
| [`ops/README.md`](ops/README.md) | Operator index + responsibility matrix |
| [`ops/deployment-runbook.md`](ops/deployment-runbook.md) | Deploy, migrate, seed, smoke-test, roll back |
| [`ops/integration-activation.md`](ops/integration-activation.md) | Enable/verify/roll back each external service |
| [`ops/monitoring-security-and-dr.md`](ops/monitoring-security-and-dr.md) | Logging, Sentry, secrets, backup/DR, incidents |
| [`ops/maintenance-and-troubleshooting.md`](ops/maintenance-and-troubleshooting.md) | Routine maintenance + known gotchas |

### Testing

| Doc | Purpose |
|-----|---------|
| [`testing.md`](testing.md) | Test suite conventions, layers, and CI gates |

## Sources of truth (when docs and code disagree, code wins)

| Concern | Authoritative source |
|---------|----------------------|
| Roles and permissions | [`src/lib/roles.ts`](../src/lib/roles.ts), [`src/lib/event-access.ts`](../src/lib/event-access.ts) |
| Delivery stages | [`src/types/core.ts`](../src/types/core.ts) (`STAGE_CONFIG`) |
| Quote lifecycle | [`src/types/quotes.ts`](../src/types/quotes.ts) |
| Capability / upsell vocabulary | [`src/lib/capabilities.ts`](../src/lib/capabilities.ts) |
| Database schema | `supabase/migrations/*` (executable truth; `supabase/schema.sql` is a reference) |
| Environment variables | [`.env.example`](../.env.example) |
| Crons | [`vercel.json`](../vercel.json) |
| Integration contracts | the route handlers under `src/app/api/` |

## Documentation conventions

- Canonical guides carry a metadata block (version, status, owner, last
  verified, sources of truth) so staleness is visible.
- Every claim about behaviour cites the file that implements it.
- Unbuilt or unconfigured capabilities are labelled explicitly (`Not
  configured`, `Portal side only`, `Decision required`) rather than described
  as if live.
- When you change code, update the doc that cites it in the same change. The
  standing rule is [`.cursor/rules/handover-documentation.mdc`](../.cursor/rules/handover-documentation.mdc).
