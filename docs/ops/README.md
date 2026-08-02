# Operations Runbooks

> **Version:** 0.1.0 · **Status:** current · **Owner:** Platform / SRE ·
> **Last verified:** 2026-07-25.
>
> Runbooks for deploying, integrating, monitoring, and maintaining
> Bright.Experience in production. These are operational procedures — for what
> the system *is*, start at [`docs/00-documentation-index.md`](../00-documentation-index.md).

Unbuilt or unconfigured controls are labelled explicitly (`Not configured`,
`Portal side only`, `Decision required`). Nothing aspirational is presented as
if it were live.

## Runbooks

| Runbook | Use it when |
|---------|-------------|
| [`deployment-runbook.md`](deployment-runbook.md) | Deploying, promoting an environment, running migrations, smoke-testing, rolling back |
| [`integration-activation.md`](integration-activation.md) | Turning on / verifying / rolling back Resend, Cal.com, Cloud, Pipedrive, Sentry, file scan |
| [`monitoring-security-and-dr.md`](monitoring-security-and-dr.md) | Logging, alerts, secrets, PII, backups, disaster recovery, incidents |
| [`maintenance-and-troubleshooting.md`](maintenance-and-troubleshooting.md) | Routine upkeep and diagnosing known failure modes |

## Responsibility matrix

| Area | Primary | Backing docs |
|------|---------|--------------|
| App deploy (Vercel) | Platform | deployment-runbook |
| Database + migrations (Supabase) | Platform | deployment-runbook, [`docs/11`](../11-cloud-handoff.md) |
| Auth / redirect config | Platform | deployment-runbook §Auth |
| Cron schedules + secrets | Platform | [`docs/16`](../16-api-and-actions-reference.md), integration-activation |
| Inbound webhooks (Cloud, Cal.com) | Platform + integration owner | integration-activation |
| CRM (Pipedrive) | RevOps + Platform | integration-activation, [`docs/10`](../10-integrations.md) |
| Email deliverability (Resend) | Platform | integration-activation |
| Error monitoring (Sentry) | Platform | monitoring-security-and-dr |
| PII / GDPR / retention | Data protection owner | monitoring-security-and-dr, [`OWNER-TODO.md`](../../OWNER-TODO.md) |
| Backups / DR | Platform | monitoring-security-and-dr |

## Environment tiers

Environment variables are tiered in [`.env.example`](../../.env.example):
**Required** (four Supabase/site vars), **Recommended** (Resend, Sentry,
`CRON_SECRET`), **Optional** (Cloud, Cal.com, Pipedrive, file scan). Mock mode
(`NEXT_PUBLIC_MOCK_MODE=true`) needs none of them. See the production checklist
in [`README.md`](../../README.md) and [`docs/11-cloud-handoff.md`](../11-cloud-handoff.md).
