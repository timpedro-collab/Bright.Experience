# Bright.Experience

The full-platform experience engine for Bright.Blue Events — from discovery and quoting, through creative production and approval, to event delivery, live telemetry, and proof of performance. One portal serving four audiences: **customers**, the internal **operations** team, the **creative** team, and **partners / venues**.

The product is organised around journeys, not screens. Every surface earns its place in one of three flows below, rendered on a single, consistent **Cloud** design system.

## The three journeys

```mermaid
flowchart TD
  subgraph customer [Customer journey]
    Discover[Discover: catalog / quiz] --> Book[Book or request a proposal]
    Book --> Onboard[Welcome + onboarding]
    Onboard --> Hub[Event hub]
    Hub --> Upload[Upload creative assets]
    Upload --> SignOff[Approve proofs]
    SignOff --> Live[Watch the event live]
    Live --> Report[Proof of performance]
  end
  subgraph creative [Creative + approval journey]
    Intake[Asset arrives] --> Review[Reviewer workspace]
    Review --> Decision[Approve or request revision]
    Decision -->|revise| Round[New version / revision round]
    Round --> Review
    Decision -->|hand to studio| Studio[Bright.Studio order]
  end
  subgraph ops [Ops journey]
    Pipeline[Pipeline kanban] --> Work[My Work + Inbox]
    Work --> Gates[Stage gates: QA / logistics / compliance]
    Gates --> Advance[Advance stage]
    Advance --> Pipeline
  end
  Upload --> Intake
  Decision --> Hub
  Advance --> Hub
```

- **Customer** — discovery → booking/proposal → onboarding → event hub (assets, approvals, tasks, messages, live, leads, reports).
- **Creative + approval** — customer uploads land in the creative review queue (`/admin/asset-reviews`), where each asset is checked against its spec, previewed on the machine, and approved or sent back with a note. Paid creative help routes through Bright.Studio.
- **Ops** — the delivery pipeline kanban (`/pipeline`), per-user work (`/inbox`, My Work on `/`), and the 10 delivery stages with their QA / logistics / compliance gates.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | Next.js 16 (App Router, React 19, TypeScript) |
| **Styling** | Tailwind CSS v4 + shadcn/ui, semantic CSS-variable tokens |
| **Database** | Supabase (Postgres with Row-Level Security) |
| **Auth** | Supabase Auth (email/password, invites, session management) |
| **Storage** | Supabase Storage (private buckets, signed URLs) |
| **Real-time** | Supabase Realtime + polling for live dashboards |
| **Email** | Resend (transactional + digest notifications) |
| **Telemetry** | Bright.Blue Cloud (live API poll + inbound webhooks) |
| **CRM** | Pipedrive (outbound write-back) |
| **Observability** | Sentry (client / server / edge) |
| **Validation** | Zod (form and API validation) |
| **Charts** | Recharts (theme-aware Cloud chart kit) |
| **Motion** | Framer Motion (page transitions, count-ups, stagger) |
| **Icons** | Lucide React |

## Getting Started

### Prerequisites

- Node.js 18+
- npm 9+
- A Supabase project (free tier works for development)

### Setup

```bash
git clone <repo-url>
cd Bright.Experience

npm install

# Copy environment file and fill in your values
cp .env.example .env.local

# Push database schema to Supabase
npx supabase db push

# Seed demo data (optional)
npx tsx supabase/seed-users.ts
npx tsx supabase/run-seed.ts

# Start development server
npm run dev
```

Open [http://localhost:3001](http://localhost:3001) to view the app.

### Environment Variables

| Variable | Tier | Purpose | If missing |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | **Required** | Supabase project URL | App cannot auth or read/write |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | **Required** | Supabase anon key | App cannot auth or read/write |
| `NEXT_PUBLIC_SITE_URL` | **Required** | Canonical site URL for email links & auth redirects | Broken magic links / redirects |
| `SUPABASE_SERVICE_ROLE_KEY` | **Required** | Service-role client for crons, webhooks, invites, admin scans | Crons / webhooks / invites throw |
| `RESEND_API_KEY` | Recommended | Transactional + digest email | Emails logged to console, skipped |
| `BRIGHTBLUE_API_KEY` + `BRIGHTBLUE_API_URL` | Recommended | Live Cloud telemetry poll | Live dashboard falls back to DB |
| `BRIGHTBLUE_WEBHOOK_SECRET` | Recommended | HMAC verify on inbound telemetry webhooks | Inbound telemetry rejected (503) |
| `NEXT_PUBLIC_SENTRY_DSN` | Recommended | Error reporting (prod) | Sentry disabled |
| `CRON_SECRET` | Optional | Bearer auth on `/api/cron/*` | Cron routes 401 unless Vercel header |
| `PIPEDRIVE_API_TOKEN` | Optional | CRM write-back | No-op (or falls back to DB config) |
| `FROM_EMAIL` / `STUDIO_TEAM_EMAIL` / `SALES_TEAM_EMAIL` | Optional | Email addresses | Defaults to `@brightblue.co.uk` |

See `.env.example` for the full list with setup instructions.

## Architecture Principles

- **Pages compose, components render, actions mutate, queries read** — strict separation of concerns.
- **Server Components by default** — `"use client"` only when interactivity is needed.
- **Row-Level Security** — the database enforces access boundaries, not just application code.
- **shadcn/ui primitives** — all standard UI uses shadcn; domain components compose them. Never hand-roll a `.btn`/`.card`/`.badge`/`.input`.
- **Zod validation** — every form input validated client-side and in Server Actions.
- **No file > 200 lines** — large files split into focused modules.

## Project Structure

```
src/
├── app/                    # Next.js App Router pages and API routes
│   ├── actions/            # Server Actions (mutations) grouped by domain
│   ├── (public)/           # Public pages (catalog, book, proposal, quiz, report)
│   ├── events/[id]/        # Event workspace (overview, assets, approvals, live, reports, …)
│   ├── partners/[slug]/    # Partner portal (dashboard, clients, commissions)
│   ├── venues/[slug]/      # Venue portal (dashboard, placements, sponsorships)
│   ├── admin/              # Internal tools (quotes, asset reviews, partners, campaigns, invoices, API)
│   ├── pipeline/           # Ops delivery kanban
│   ├── inbox/              # Cross-event assigned work
│   ├── studio/             # Internal studio dashboard
│   ├── p/[code]/           # Partner attribution redirect
│   ├── api/                # Route handlers (live, export, search, webhooks, crons)
│   └── login/              # Authentication
├── components/
│   ├── ui/                 # shadcn/ui primitives (do not modify directly)
│   ├── cloud/              # Cloud design-system kit (see Design System below)
│   ├── brand/              # Page chrome: EditionShell, RidgeHero, Admin/EventPageShell, RidgeArtwork
│   ├── layout/             # Sidebar AppShell, command palette, user menu, notifications
│   ├── assets/             # Upload zone, machine preview, asset rows
│   ├── admin/              # Review queue + internal work surfaces
│   ├── telemetry/          # Live counters, charts, lead tables
│   ├── reports/            # Proof of performance and reporting
│   └── …                   # events, quotes, briefing, approvals, qa, logistics, partners, venues, campaigns
├── lib/
│   ├── queries/            # Supabase read queries (one file per entity)
│   ├── validations/        # Zod schemas (one file per domain)
│   ├── supabase/           # Client config (browser + server + service-role)
│   ├── notifications/      # Unified notification spine (dispatch, archetypes, email shell)
│   ├── brightblue/         # Cloud telemetry client
│   ├── asset-requirements/ # Game-flow asset specs + on-machine placement previews
│   ├── rbac.ts / roles.ts  # Role & permission helpers
│   └── …                   # auth, dates, env, surfaces, exports
├── types/index.ts          # TypeScript types and enums (stages, statuses, entities)
└── middleware.ts           # Auth middleware and route protection

supabase/
├── migrations/             # Database migrations (applied in order)
├── schema.sql              # Canonical schema reference
├── seed-users.ts           # Auth user seeding
└── run-seed.ts             # Application data seeding

docs/                       # Product documentation (see Documentation below)
```

## Design System — "Cloud"

Bright.Experience uses the **Cloud** design language: calm, premium, light-first, built on solid surfaces and a polished slate dark mode. Design tokens live in [`src/app/globals.css`](src/app/globals.css) and map onto shadcn/ui's semantic variable system, so primitives pick up theme switches automatically.

### Themes

- **Light (default)** — cool slate-50 ground, white cards, slate hairlines. The default for the authenticated portal.
- **Dark ("Cloud Slate")** — deep slate ground, cobalt accents.

The theme is a single `.theme-light` class toggled on `<html>` by [`ThemeProvider`](src/components/theme/ThemeProvider.tsx), persisted to `localStorage`, with an inline FOUC guard.

### The Cloud kit (`src/components/cloud/`)

| Primitive | Purpose |
|-----------|---------|
| `PageHeader` / `Eyebrow` | Standard page title block (cobalt eyebrow, title, subtitle, actions) |
| `KpiGrid` / `KpiCard` | Responsive KPI tiles with delta + trend |
| `GlassCard` / `GlassCardHeader` | The signature solid card surface + section header |
| `ChartCard` / `CloudBarChart` / `CloudAreaChart` | Theme-aware Recharts wrappers (read live CSS vars) |
| `DataTableShell` / `Column` | Generic table inside a card, with toolbar + empty state |
| `FilterPill` / `SegmentedControl` | Toolbar filters and segment toggles |
| `StatusPill` / `EmptyState` | Status chips and empty-state placeholders |
| `PdfCanvas` | Client-side PDF rendering for asset previews |

### Page chrome (`src/components/brand/`)

| Primitive | Purpose |
|-----------|---------|
| `EditionShell` + `EditionChrome` + `RidgeHero` + `EditionBody` + `EditionFooter` | The page chassis every authenticated surface composes |
| `EventPageShell` | Wraps `EditionShell` for any `/events/[id]/*` sub-page |
| `AdminPageShell` | Same shape for internal `/admin/*` and adjacent pages |
| `EditionPlate` | Compact card for a single event in list views |
| `RidgeArtwork` | The deterministic "maze of lines" SVG fingerprint |

### The ridge ("maze of lines")

The ridge is Bright.Blue's signature. It appears as a **faint whisper in page heroes only** (`RidgeHero variant="compact"`) and as the loud editorial moment on marketing / login surfaces — never as full-page background noise.

### Typography

- **Display & headings** — Nunito (`--font-heading`)
- **Body** — DM Sans (`--font-body`)
- **Overline / metadata** — DM Sans Medium, tracked (`text-overline`)

Font files live in `public/fonts/`, wired in [`src/app/layout.tsx`](src/app/layout.tsx).

### Motion

Framer Motion primitives in [`src/components/ui/motion.tsx`](src/components/ui/motion.tsx): `PageTransition`, `FadeIn`, `Stagger` / `StaggerItem`, and `AnimatedCounter` for KPI count-ups.

### Component rules

- Every authenticated page uses a shell (`EditionShell` / `AdminPageShell` / `EventPageShell`) — never a one-off layout.
- Use shadcn primitives for all standard UI; `<Badge variant="success|warning|destructive|info|muted">`, `<Button variant="brand">`, `<Card interactive>`.
- One generative ridge per page (the hero).
- Use the legal radii tokens, never ad-hoc `rounded-2xl`/`rounded-3xl`.
- No emoji in UI unless explicitly requested.

## Delivery stages

The 10-stage delivery pipeline (`Stage` in [`src/types/index.ts`](src/types/index.ts)):

`confirmed → kickoff_complete → creative_assets → approvals → build_configuration → qa_readiness → logistics_confirmed → event_live → reporting → complete`

Stage advancement is gated by blocking tasks/milestones (`canAdvanceStage` in [`src/app/actions/stages.ts`](src/app/actions/stages.ts)), and emits notifications + Pipedrive write-back.

## Roles

| Role | Type | Access |
|------|------|--------|
| `customer_user` | External | Own event delivery access |
| `customer_admin` | External | Delivery + team + reporting + sign-off |
| `events_lead` | Internal | Event management (admin-equivalent for ops) |
| `creative_lead` | Internal | Creative / studio management + asset reviews |
| `operations_lead` | Internal | Operations and logistics |
| `qa_lead` | Internal | Quality assurance |
| `developer` | Internal | Technical configuration |
| `admin` | Internal | Full platform access |
| `partner_member` / `partner_admin` | Partner | Partner portal access + management |

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server (port 3001) |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npx tsc --noEmit` | Type-check the project |

## Documentation

See the `docs/` directory:

- **01 Product Definition** — what the platform is, who it serves, success criteria
- **02 Event Lifecycle** — the 10-stage delivery pipeline with health tracking
- **03 Roles & Permissions** — access control matrix
- **04 Data Model** — entity relationships and field definitions
- **05 Information Architecture** — route map and navigation
- **06 Build Roadmap** — phased delivery plan
- **07 Platform Vision** — catalog, quoting, partners, venues
- **08 Pricing & Quoting Model** — two-track quoting strategy
- **09 Design System** — the Cloud language reference and banned patterns

## Production Checklist

Before going live, verify every item:

1. **Required env** — all `Required`-tier variables set in the hosting provider (Vercel project settings).
2. **`NEXT_PUBLIC_SITE_URL`** — set to the production domain, not localhost.
3. **`SUPABASE_SERVICE_ROLE_KEY`** — set server-side only; never exposed to the browser.
4. **Supabase Auth** — redirect URLs configured to match the production domain.
5. **Resend** — domain verified, `RESEND_API_KEY` set, `FROM_EMAIL` on the verified domain.
6. **Cron secrets** — `CRON_SECRET` set in Vercel, matching `vercel.json` cron headers.
7. **Bright.Blue Cloud** — `BRIGHTBLUE_WEBHOOK_SECRET` set, webhook URL registered; `BRIGHTBLUE_API_URL`/`BRIGHTBLUE_API_KEY` set for live poll.
8. **Sentry** — `NEXT_PUBLIC_SENTRY_DSN` set (and `SENTRY_ORG`/`SENTRY_PROJECT` for source-map upload in CI).
9. **Database migrations** — `npx supabase db push` applies everything in `supabase/migrations/`.
10. **Stubs** — review `STUBS-TO-REPLACE.md` and replace any launch-blocking stubs (payments, virus scan).
11. **Legal copy** — `/privacy` and `/terms` contain reviewed legal text, not placeholders.
