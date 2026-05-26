# Bright.Experience

Full-platform experience engine for Bright.Blue Events — from discovery and quoting through event delivery, live telemetry, proof of performance, partner management, and venue operations. Serves customers, resellers, venues, and the internal operations team.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | Next.js 16 (App Router, React 19, TypeScript) |
| **Styling** | Tailwind CSS v4 + shadcn/ui components |
| **Database** | Supabase (Postgres with Row-Level Security) |
| **Auth** | Supabase Auth (email/password, session management) |
| **Storage** | Supabase Storage (signed URLs, RLS-gated) |
| **Real-time** | Supabase Realtime (live dashboards, notifications) |
| **Email** | Resend (transactional notifications) |
| **Validation** | Zod (form and API validation) |
| **Charts** | Recharts (live dashboards, reporting) |
| **Icons** | Lucide React |

## Getting Started

### Prerequisites

- Node.js 18+
- npm 9+
- A Supabase project (free tier works for development)

### Setup

```bash
# Clone the repository
git clone <repo-url>
cd Bright.Experience

# Install dependencies
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

Open [http://localhost:3000](http://localhost:3000) to view the app.

### Environment Variables

See `.env.example` for all required and optional variables with descriptions.

## Project Structure

```
src/
├── app/                    # Next.js App Router pages and API routes
│   ├── actions/            # Server Actions (mutations) grouped by domain
│   ├── (public)/           # Public pages (catalog, book, proposal, quiz, report)
│   ├── events/[id]/        # Event workspace (overview, live, leads, reports, etc.)
│   ├── partners/[slug]/    # Partner portal (dashboard, clients, commissions)
│   ├── venues/[slug]/      # Venue portal (dashboard, placements, sponsorships)
│   ├── admin/              # Internal tools (quotes, partners, campaigns, API)
│   ├── p/[code]/           # Partner attribution redirect
│   ├── login/              # Authentication
│   └── studio/             # Internal studio dashboard
├── components/
│   ├── ui/                 # shadcn/ui primitives (do not modify directly)
│   ├── layout/             # App shell, sidebar, page header
│   ├── events/             # Event-specific components
│   ├── studio/             # Studio-specific components
│   ├── assets/             # Asset management components
│   ├── approvals/          # Approval workflow components
│   ├── briefing/           # Creative briefing components
│   ├── catalog/            # Public storefront catalog components
│   ├── quotes/             # Quoting engine components
│   ├── notifications/      # Notification bell and list
│   ├── messages/           # Per-event messaging
│   ├── qa/                 # QA checklist components
│   ├── logistics/          # Logistics timeline components
│   ├── telemetry/          # Live counters, charts, lead tables
│   ├── reports/            # Proof of performance and reporting
│   ├── partners/           # Partner portal components
│   ├── venues/             # Venue placement and sponsorship
│   ├── campaigns/          # Campaign and recommendation components
│   ├── api/                # API key and webhook management
│   └── timeline/           # Milestone timeline components
├── lib/
│   ├── queries/            # Supabase read queries (one file per entity)
│   ├── validations/        # Zod schemas (one file per domain)
│   ├── supabase/           # Supabase client configuration (browser + server)
│   ├── utils.ts            # cn() utility and shared helpers
│   ├── rbac.ts             # Role/permission helpers
│   ├── rate-limit.ts       # Rate limiting for Server Actions
│   ├── auth.ts             # User authentication helpers
│   ├── roles.ts            # Role classification utilities
│   ├── dates.ts            # Date formatting utilities
│   └── email.ts            # Resend email integration
├── types/
│   └── index.ts            # TypeScript types and enums
└── middleware.ts            # Auth middleware and route protection

supabase/
├── migrations/             # Database migrations (applied in order)
├── schema.sql              # Canonical schema reference
├── seed-users.ts           # Auth user seeding script
└── run-seed.ts             # Application data seeding script

docs/                       # Product documentation
├── 01-product-definition.md
├── 02-event-lifecycle.md
├── 03-roles-permissions.md
├── 04-data-model.md
├── 05-information-architecture.md
├── 06-build-roadmap.md
├── 07-platform-vision.md
├── 08-pricing-and-quoting-model.md
└── 09-design-system.md
```

## Architecture Principles

- **Pages compose, components render, actions mutate, queries read** — strict separation of concerns
- **Server Components by default** — `"use client"` only when interactivity is needed
- **Row-Level Security** — database enforces access boundaries, not just application code
- **shadcn/ui primitives** — all standard UI elements use shadcn; domain components compose them
- **Zod validation** — every form input validated both client-side and in Server Actions
- **No file > 200 lines** — large files get split into focused modules

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |

## Design System

Bright.Experience uses an **editorial design language** — calm, premium, intentional — anchored by the locked Bright.Blue palette and the two display fonts the brand owns. It supports two themes:

- **Deep Ink** (default dark) — `#060720` ground, cobalt accents, designed for the authenticated portal
- **Linen** (light) — `#F2EDE0` ground, used for proposal print, brochure, and any context where ink-on-paper reads better. Switched on by adding `class="theme-light"` to `<html>`

Design tokens live in `src/app/globals.css` and map to shadcn/ui's semantic variable system. shadcn primitives (`<Button>`, `<Card>`, `<Badge>`, `<Input>`) inherit those tokens, so they pick up theme switches automatically — never hand-roll a `.btn`/`.card`/`.badge`/`.input` class.

### Brand primitives (`src/components/brand/`)

| Primitive | Purpose |
|-----------|---------|
| `RidgeArtwork` | Deterministic SVG ridge fingerprint, seeded per event. Replaces decorative orbs. |
| `EditorialEyebrow` | Tracked uppercase overline label (DM Sans Medium) used everywhere we'd previously have used a small heading. |
| `Hairline` | 1px gradient rule that separates editorial sections without the weight of a card border. |
| `EditionShell` + `EditionChrome` + `RidgeHero` + `EditionBody` + `EditionFooter` | The full editorial page chassis. Every authenticated page composes these. |
| `EventPageShell` | Helper that wraps `EditionShell` for any `/events/[id]/*` sub-page. Pass `event`, `section`, `title`, `subtitle`, optional `heroRight`/`children`. |
| `AdminPageShell` | Same shape as `EventPageShell` for internal `/admin/*` and adjacent pages. |
| `EditionPlate` | Compact card representing a single event — used wherever we list multiple events at a glance. |

### Typography

- **Display & headings** — Nunito Bold (`--font-display`)
- **Body** — DM Sans Regular (`--font-body`)
- **Overline / metadata / eyebrows** — DM Sans Medium, tracked +0.08em (`text-overline`)

The full font files live in `public/fonts/` and are wired up in `src/app/layout.tsx`.

### Colour tokens (cheat sheet)

| Token | Use |
|-------|-----|
| `--color-bb-cobalt` | Brand primary, links, active state |
| `--color-bb-cyan` | Live / "in flight" state |
| `--color-bb-deep-ink` | Deep Ink ground |
| `--color-bb-linen` | Linen ground |
| `--color-bb-paper` | Linen card surface |
| `var(--radius-card)` / `var(--radius-control)` / `var(--radius-chip)` | The three legal radii — never use ad-hoc `rounded-2xl`/`rounded-3xl` |

### Component rules

- Every authenticated page uses an `EditionShell` (or one of the helper shells above) — never a one-off layout.
- Use shadcn primitives (`<Button>`, `<Card interactive>`, `<Badge variant="success|warning|destructive|info|muted">`, `<Input>`, `<Textarea>`) for all standard UI. Card has a built-in `interactive` prop for hover affordances; Button has a `brand` variant for the gradient CTA.
- Only one `tone="glass"` `<Card>` per page — pick the hero card.
- One generative ridge per page — usually the `RidgeHero`; the `EditionPlate` ridges are an exception because they are signatures for sub-routes, not the page itself.
- No emoji in UI unless explicitly added by the user.

## Roles

| Role | Type | Access |
|------|------|--------|
| `customer_user` | External | Own event delivery access |
| `customer_admin` | External | Delivery + team + reporting |
| `events_lead` | Internal | Event management |
| `creative_lead` | Internal | Creative/studio management |
| `operations_lead` | Internal | Operations and logistics |
| `qa_lead` | Internal | Quality assurance |
| `developer` | Internal | Technical configuration |
| `admin` | Internal | Full platform access |
| `partner_member` | Partner | Partner portal access |
| `partner_admin` | Partner | Partner management + team |

## Documentation

See the `docs/` directory for detailed product documentation:

- **Product Definition** — what the platform is, who it serves, success criteria
- **Event Lifecycle** — 10-stage delivery pipeline with health tracking
- **Roles & Permissions** — access control matrix
- **Data Model** — entity relationships and field definitions
- **Platform Vision** — expanded vision including catalog, quoting, partners
- **Pricing Model** — two-track quoting strategy (standard + experiential)
- **Design System** — canonical reference for the editorial UI language, brand primitives, and banned patterns
