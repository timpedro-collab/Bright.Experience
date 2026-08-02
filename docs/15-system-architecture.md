# 15 — System Architecture

> **Version:** 0.1.0 · **Status:** current · **Owner:** Platform ·
> **Last verified:** 2026-07-25 against `main`.
>
> Diagrams of how Bright.Experience is put together and how data moves through
> it. Pairs with [`docs/14-codebase-map.md`](14-codebase-map.md) (structure) and
> [`docs/16-api-and-actions-reference.md`](16-api-and-actions-reference.md)
> (endpoints). Diagrams are Mermaid; they render on GitHub and in most IDEs.

## 1. System context

```mermaid
flowchart TB
    subgraph Users
      P[Public prospect]
      C[Customer / customer_admin]
      I[Internal: events/creative/ops/qa/admin]
      PA[Partner]
      V[Venue operator]
    end

    APP[Bright.Experience<br/>Next.js 16 on Vercel]

    subgraph External
      SB[(Supabase<br/>Postgres · Auth · Storage)]
      RS[Resend<br/>email]
      CAL[Cal.com<br/>walkthrough booking]
      BBC[Bright.Blue Cloud<br/>machines · telemetry · leads]
      PD[Pipedrive CRM]
      SEN[Sentry]
    end

    P & C & I & PA & V --> APP
    APP <--> SB
    APP --> RS
    APP --> PD
    APP <-->|API poll + PUT config| BBC
    CAL -->|webhook| APP
    BBC -->|webhook| APP
    APP --> SEN
```

## 2. Runtime containers & request path

```mermaid
flowchart LR
    B[Browser] -->|HTTPS| MW[middleware.ts<br/>auth gate]
    MW --> RSC[Server Components<br/>pages]
    MW --> RH[Route handlers<br/>api/*]
    RSC -->|read| Q[lib/queries/*]
    RSC -.form action.-> SA[Server Actions<br/>app/actions/*]
    RH --> Q
    SA -->|validate zod| Z[lib/validations/*]
    SA -->|write| SVC[Supabase client]
    Q --> SVC
    SVC --> DB[(Postgres + RLS)]
    SA --> N[Notifications spine]
    SA --> PDO[Pipedrive outbox]
```

The app is RSC-first: pages fetch through `lib/queries/*` and render; mutations
go through server actions, which validate (Zod), check permissions
(`roles.ts` / `event-access.ts`), write via Supabase, then fan out to the
notifications spine and Pipedrive outbox. RLS is the last line of defence at
the database.

## 3. Authenticated vs. self-authenticating requests

```mermaid
flowchart TB
    subgraph "Session-authenticated (cookie)"
      U[User] --> M[middleware.ts]
      M -->|valid session| PG[Page / API]
      M -->|no session| LOGIN[/login redirect/]
      PG --> RLS1[RLS scopes rows to user]
    end

    subgraph "Self-authenticating (no session)"
      VC[Vercel Cron] -->|Bearer CRON_SECRET| CR[/api/cron/*]
      CR -->|mismatch/unset| F1[401 fail-closed]
      EXT[Cal.com / Cloud] -->|HMAC signature| WH[/api/webhooks/*]
      WH -->|bad/unset secret| F2[401 / 503 fail-closed]
    end
```

Cron and webhook routes carry no user session; they authenticate themselves
(`requireCron` / HMAC) and **fail closed** — see
[`docs/16-api-and-actions-reference.md`](16-api-and-actions-reference.md).

## 4. Quote → proposal → walkthrough → provisioning lifecycle

```mermaid
stateDiagram-v2
    [*] --> draft
    draft --> submitted: intake submitted (book_now or proposal)
    submitted --> proposal_sent: prepareProposal + sendProposalReadyEmail
    proposal_sent --> proposal_sent: book walkthrough (Cal.com)
    note right of proposal_sent
      Pricing hidden until
      walkthrough_completed_at
      OR quote accepted
    end note
    proposal_sent --> accepted: customer accepts
    proposal_sent --> declined: customer declines
    submitted --> expired: expiresAt passed
    accepted --> [*]: provisioning → Event (stage=confirmed)
```

`QuoteStatus` values: `draft · submitted · proposal_sent · accepted · declined ·
expired` ([`src/types/quotes.ts`](../src/types/quotes.ts)). Acceptance triggers
`provisioning.ts`, creating an `Event` at stage `confirmed`.

## 5. Delivery pipeline (post-provisioning)

```mermaid
flowchart LR
    S0[confirmed] --> S1[kickoff_complete] --> S2[creative_assets] --> S3[approvals] --> S4[build_configuration] --> S5[qa_readiness] --> S6[logistics_confirmed] --> S7[event_live] --> S8[reporting] --> S9[complete]
```

Advancement is gated by blocking tasks/milestones (`canAdvanceStage` in
[`src/app/actions/stages.ts`](../src/app/actions/stages.ts)); each transition
emits notifications and a Pipedrive write-back. Stage vocabulary:
[`src/types/core.ts`](../src/types/core.ts) (`STAGE_CONFIG`).

## 6. Notification dispatch, preferences, digest

```mermaid
flowchart TB
    EV[Action / cron event] --> DISP[dispatchNotification]
    DISP --> ARCH[Archetype catalogue<br/>lib/notifications/archetypes]
    ARCH --> PREF{User settings<br/>notification_user_settings}
    PREF -->|in-portal on| INP[(notifications row)]
    PREF -->|email immediate| RESEND[Resend]
    PREF -->|email digest| QUEUE[digest queue]
    CRONH["/api/cron/digest (hourly)"] --> QUEUE
    QUEUE -->|local hour matches pref| RESEND
    CRONR["/api/cron/reminders (daily 09:00)"] --> DISP
```

Reminders escalate on approaching/overdue deadlines. The digest cron ticks
hourly and sends each recipient at their preferred local hour.

## 7. Telemetry → snapshot → live dashboard / report

```mermaid
flowchart LR
    MACH[Machine] --> BBC[Bright.Blue Cloud]
    BBC -->|webhook: telemetry, lead.captured, stock| WH["/api/webhooks/brightblue"]
    WH --> SNAP[(event_metrics_snapshot<br/>+ stock_remaining/capacity)]
    WH --> LEADS[(leads + consented_at)]
    WH -->|threshold crossed| STK[machine.stock_low notification]
    LIVEP["LiveDashboardClient (poll 20s)"] --> LIVEAPI["/api/events/:id/live"]
    LIVEAPI -->|Cloud snapshot if configured| BBC
    LIVEAPI -->|else local| SNAP
    SNAP --> RPT[reports.ts → proof-of-performance]
    LEADS --> RPT
```

## 8. Portal → Cloud → machine configuration sync

```mermaid
flowchart LR
    FORM[GameConfigForm submit] --> SA[game-config.ts saveGameConfiguration]
    SA --> DB[(game_configurations<br/>capture_rules_json, retention_days, branded_landing)]
    SA --> PAY[buildEventConfigPayload<br/>lib/brightblue/config-payload.ts]
    PAY --> PUSH[pushEventConfig]
    PUSH -->|PUT /events/:id/config| BBC[Bright.Blue Cloud]
    BBC --> MACH[Machine applies config]
```

Capture-quality **enforcement** (business-email-only, duplicate blocking) is
**machine-side**; the portal only authors and pushes the rules. See
[`docs/10-integrations.md`](10-integrations.md) and
[`docs/13-dev-handover-priorities.md`](13-dev-handover-priorities.md).

## 9. Mock mode vs. live services

```mermaid
flowchart TB
    subgraph "NEXT_PUBLIC_MOCK_MODE=true"
      APP1[App] --> MOCK[In-memory mock client<br/>lib/supabase/mock]
      MOCK --> DS[dataset.ts<br/>date-shifted to today]
      APP1 -.->|no-op| STUBS[Resend/Cloud/Cal/Pipedrive stubs]
      AUTH1[Cookie bx_mock_uid = fake auth]
    end
    subgraph "Live"
      APP2[App] --> REAL[Supabase clients<br/>server/client/service-role]
      REAL --> PG[(Postgres + RLS)]
      APP2 --> EXT[Real Resend/Cloud/Cal/Pipedrive when configured]
    end
```

The swap is decided by `isMockMode()`
([`src/lib/supabase/mock/flag.ts`](../src/lib/supabase/mock/flag.ts)). Mock mode
is the default demo runtime and needs no external accounts.

## Cross-cutting notes

- **Live updates are polling, not Realtime.** `AutoRefresh` polls every ~20s;
  Supabase Realtime is not wired (see `docs/11-cloud-handoff.md` D1). The
  README stack table reflects this.
- **Security headers** are set in [`next.config.ts`](../next.config.ts); the
  venue `/embed` iframe surface interacts with frame policy — see
  [`docs/ops/monitoring-security-and-dr.md`](ops/monitoring-security-and-dr.md).
- **PDF/export** routes set `maxDuration=60` for serverless limits.
