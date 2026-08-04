# Core Data Model

> **Version:** 0.1.0 · **Status:** current · **Last verified:** 2026-07-25.
> Schemas here are hand-maintained summaries. The **executable truth** is the
> **59 migrations** in `supabase/migrations/*` (applied in filename order);
> `supabase/schema.sql` and [`docs/11-cloud-handoff.md`](11-cloud-handoff.md)
> Part B are the fullest column-level references. The notification settings
> table is `notification_preferences` (per-user, per-kind).

## Entity Relationship Overview

```
Account (1) ──── (n) Event
Event   (1) ──── (n) Milestone
Event   (1) ──── (n) Task
Event   (1) ──── (n) Asset
Event   (1) ──── (n) Approval
Event   (1) ──── (n) StudioRequest
Event   (1) ──── (n) ScopeChange
Event   (1) ──── (n) ProductItem
Event   (1) ──── (n) QAChecklistItem / QAItem
Event   (1) ──── (n) Report
Event   (1) ──── (n) AuditEntry
Event   (1) ──── (n) Note
Event   (1) ──── (n) Message
Event   (1) ──── (n) LogisticsEntry
Event   (1) ──── (n) TelemetryEvent
Event   (1) ──── (n) Lead
Event   (1) ──── (n) EventMetricsSnapshot
Event   (1) ──── (n) MachineInstance (via current_event_id)
Machine (1) ──── (n) MachineInstance (via machine_type_id)
MachineInstance (1) ── (n) TelemetryEvent
MachineInstance (1) ── (n) Lead
Event   (n) ──── (1) EventTemplate
User    (1) ──── (n) Notification
Task    (1) ──── (n) Comment
User    (1) ──── (n) Role (per account/event)
Partner (1) ──── (n) PartnerUser
Partner (1) ──── (n) PartnerAttribution
Quote   (n) ──── (1) Partner (via partner_id)
Profile (1) ──── (n) PartnerUser
```

---

## Core Entities

### Account
The customer organization. One account may have many events.

```
Account {
  id              UUID
  name            string          // "Coca-Cola UK"
  slug            string          // "coca-cola-uk"
  logo_url        string?
  primary_contact User
  created_at      timestamp
  updated_at      timestamp
}
```

### Event
The central entity. Everything else hangs off an event.

```
Event {
  id                UUID
  account_id        UUID → Account
  name              string          // "Coca-Cola Summer Festival 2026"
  event_type        enum            // activation | sampling | vending | hybrid | custom
  package_type      enum            // standard | premium | custom
  machine_type      string?         // "Bright.Vend Pro" / "Bright.Play" etc.
  venue_name        string?
  venue_address     string?
  event_date_start  date
  event_date_end    date?
  setup_date        date?
  collection_date   date?
  current_stage     enum → Stage
  health_status     enum            // green | amber | red
  health_override   boolean         // manually set?
  health_reason     string?         // reason for override
  template_id       UUID? → EventTemplate
  created_by        UUID → User
  created_at        timestamp
  updated_at        timestamp
}
```

### Stage (enum)
```
Stage {
  CONFIRMED           // Stage 0
  KICKOFF_COMPLETE     // Stage 1
  CREATIVE_ASSETS      // Stage 2
  APPROVALS            // Stage 3
  BUILD_CONFIGURATION  // Stage 4
  QA_READINESS         // Stage 5
  LOGISTICS_CONFIRMED  // Stage 6
  EVENT_LIVE           // Stage 7
  REPORTING            // Stage 8
  COMPLETE             // Stage 9
}
```

### Milestone
Tracks high-level progress markers visible to customer.

```
Milestone {
  id              UUID
  event_id        UUID → Event
  name            string          // "Creative Approved"
  stage           enum → Stage
  status          enum            // pending | in_progress | complete | skipped
  target_date     date?
  completed_at    timestamp?
  completed_by    UUID? → User
  sort_order      integer
  customer_visible boolean
  created_at      timestamp
}
```

### Task
Granular work items. Can be customer-facing or internal-only.

```
Task {
  id              UUID
  event_id        UUID → Event
  milestone_id    UUID? → Milestone
  title           string
  description     string?
  task_type       enum            // customer_action | internal_action
  category        enum            // creative | operations | qa | development | logistics | reporting | admin
  status          enum            // pending | in_progress | complete | blocked | skipped
  priority        enum            // low | medium | high | critical
  assigned_to     UUID? → User
  assigned_role   enum? → Role    // fallback if no specific user
  due_date        date?
  completed_at    timestamp?
  completed_by    UUID? → User
  depends_on      UUID[]? → Task
  is_blocking     boolean
  customer_visible boolean
  sort_order      integer
  snoozed_until   timestamp?      // Aug 2026: internal queue snooze — queries exclude tasks snoozed into the future
  created_at      timestamp
  updated_at      timestamp
}
```

### Asset
Files uploaded by customer or internal team.

```
Asset {
  id              UUID
  event_id        UUID → Event
  task_id         UUID? → Task
  name            string          // "Primary Logo"
  description     string?
  asset_type      enum            // logo | brand_guidelines | imagery | video | copy | other
  required_format string?         // "SVG, PNG (min 300dpi)"
  required_dimensions string?     // "1920x1080"
  file_url        string?
  file_name       string?
  file_size       integer?        // bytes
  file_type       string?         // MIME type
  version         integer         // starts at 1, increments on replace
  status          enum            // required | uploaded | under_review | accepted | rejected
  review_feedback string?
  reviewed_by     UUID? → User
  reviewed_at     timestamp?
  uploaded_by     UUID? → User
  due_date        date?
  customer_visible boolean
  created_at      timestamp
  updated_at      timestamp
}
```

### Approval
Formal approval gates with audit trail.

```
Approval {
  id              UUID
  event_id        UUID → Event
  title           string          // "Wrap Design Approval"
  description     string?
  approval_type   enum            // wrap | game_flow | webform | custom_dev | copy | final_readiness
  status          enum            // pending | approved | rejected | revision_requested
  preview_url     string?         // link to preview
  preview_assets  UUID[]? → Asset
  requested_by    UUID → User
  requested_at    timestamp
  decided_by      UUID? → User
  decided_at      timestamp?
  feedback        string?
  revision_count  integer         // how many rounds
  customer_visible boolean
  created_at      timestamp
  updated_at      timestamp
}
```

### StudioRequest
Bright.Studio creative service requests (upsell opportunity).

```
StudioRequest {
  id              UUID
  event_id        UUID → Event
  service_type    enum            // design | animation | video | photography | copywriting | other
  title           string
  description     string
  reference_assets UUID[]? → Asset
  estimated_cost  decimal?
  estimated_days  integer?
  status          enum            // draft | submitted | confirmed | quoted | approved | in_progress | delivered | cancelled (StudioRequestStatus, src/types/approvals.ts)
  quoted_cost     decimal?
  quoted_days     integer?
  approved_by     UUID? → User
  approved_at     timestamp?
  delivered_at    timestamp?
  deliverable_assets UUID[]? → Asset
  customer_visible boolean
  created_at      timestamp
  updated_at      timestamp
}
```

### ProductItem
Tracks physical products/prizes for the event.

```
ProductItem {
  id              UUID
  event_id        UUID → Event
  name            string          // "Coca-Cola Zero 330ml Can"
  category        enum            // prize | sample | giveaway | branded_item
  quantity_expected integer?
  quantity_received integer?
  sample_received boolean
  sample_tested   boolean
  vendable        boolean?
  slot_assigned   string?         // machine slot identifier
  mechanism       string?         // "drop" | "push" | "conveyor"
  issues_found    string?
  fix_applied     string?
  refill_plan     string?
  status          enum            // awaiting | received | testing | ready | issue | resolved
  created_at      timestamp
  updated_at      timestamp
}
```

### QAChecklistItem
Pre-event quality assurance items.

```
QAChecklistItem {
  id              UUID
  event_id        UUID → Event
  category        enum            // machine | game_logic | ux_ui | webform | wrap | logistics | product | other
  title           string
  description     string?
  status          enum            // pending | passed | failed | fixed | na
  tested_by       UUID? → User
  tested_at       timestamp?
  failure_reason  string?
  fix_description string?
  fixed_by        UUID? → User
  fixed_at        timestamp?
  sort_order      integer
  created_at      timestamp
  updated_at      timestamp
}
```

### ScopeChange
Tracks deviations from the original event scope.

```
ScopeChange {
  id              UUID
  event_id        UUID → Event
  title           string
  description     string
  change_type     enum            // addition | modification | removal
  category        enum            // creative | technical | logistics | product | other
  is_standard     boolean         // within package scope?
  cost_impact     decimal?        // additional cost (0 if standard)
  timeline_impact integer?        // days added
  status          enum            // requested | under_review | approved | rejected | implemented
  requested_by    UUID → User
  requested_at    timestamp
  reviewed_by     UUID? → User
  reviewed_at     timestamp?
  approved_by     UUID? → User
  approved_at     timestamp?
  customer_visible boolean
  created_at      timestamp
  updated_at      timestamp
}
```

### Report
Post-event reporting data (`event_reports` table).

```
Report {
  id              UUID
  event_id        UUID → Event
  brand_partner_id UUID? → Partner  // optional co-brand on published share links
  status          enum            // processing | ready | published
  published_at    timestamp?

  // Metrics
  total_interactions   integer?
  total_entries        integer?
  qualified_leads      integer?
  completion_rate      decimal?     // percentage
  opt_in_count         integer?
  opt_in_rate          decimal?     // percentage
  prizes_distributed   integer?
  samples_distributed  integer?

  // Structured data
  custom_question_results JSON?    // { question: string, answers: { value: string, count: number }[] }[]
  time_breakdown        JSON?      // { hour: string, interactions: number }[]
  date_breakdown        JSON?      // { date: string, interactions: number }[]

  // Exports
  export_csv_url       string?
  export_xlsx_url      string?

  created_at      timestamp
  updated_at      timestamp
}
```

### Note
Internal or customer-visible notes on an event.

```
Note {
  id              UUID
  event_id        UUID → Event
  author_id       UUID → User
  content         string
  is_internal     boolean         // true = never shown to customer
  pinned          boolean
  created_at      timestamp
  updated_at      timestamp
}
```

### AuditEntry
Immutable log of significant actions.

```
AuditEntry {
  id              UUID
  event_id        UUID → Event
  actor_id        UUID → User
  action          string          // "approval.approved" | "stage.advanced" | "asset.uploaded" etc.
  entity_type     string          // "Approval" | "Task" | "Asset" etc.
  entity_id       UUID
  metadata        JSON            // action-specific details
  created_at      timestamp       // immutable, no updated_at
}
```

### User
```
User {
  id              UUID
  email           string
  name            string
  avatar_url      string?
  role            enum → Role
  account_id      UUID? → Account  // null for internal users
  is_active       boolean
  last_login_at   timestamp?
  created_at      timestamp
  updated_at      timestamp
}
```

### EventTemplate
Reusable templates for common event types.

```
EventTemplate {
  id              UUID
  name            string          // "Standard Vending Activation"
  description     string?
  event_type      enum
  package_type    enum
  machine_type    string?
  milestones_json JSON            // template milestone definitions
  tasks_json      JSON            // template task definitions
  assets_json     JSON            // template asset slots
  qa_items_json   JSON            // template QA items
  is_active       boolean
  created_by      UUID → User
  created_at      timestamp
  updated_at      timestamp
}
```

### Notification
In-app notification delivered to a specific user.

```
Notification {
  id              UUID
  user_id         UUID → User
  event_id        UUID? → Event
  type            string          // stage_change | approval_decision | asset_uploaded | deadline_approaching | message_received | studio_update
  title           string
  body            string?
  is_read         boolean
  link            string?         // URL path within the app
  created_at      timestamp
}
```

### Message
Per-event messaging thread entry. Internal messages are hidden from customers.

```
Message {
  id              UUID
  event_id        UUID → Event
  sender_id       UUID → User
  body            string
  attachments     JSON            // array of attachment URLs
  is_internal     boolean         // true = hidden from customer
  created_at      timestamp
}
```

### LogisticsEntry
Delivery, setup, and collection tracking for an event.

```
LogisticsEntry {
  id                UUID
  event_id          UUID → Event
  entry_type        string        // delivery | setup | collection | other
  title             string
  description       string?
  scheduled_date    date?
  scheduled_time    string?
  status            string        // pending | confirmed | in_transit | completed | issue
  contact_name      string?
  contact_phone     string?
  tracking_reference string?
  notes             string?
  completed_at      timestamp?
  completed_by      UUID? → User
  sort_order        integer
  created_at        timestamp
  updated_at        timestamp
}
```

---

## Telemetry Entities (Phase 4)

### MachineInstance
A physical machine unit tracked by serial number, deployed to events.

```
MachineInstance {
  id                  UUID
  machine_type_id     UUID → Machine
  serial_number       string          // unique hardware identifier
  nickname            string?
  current_event_id    UUID? → Event
  current_placement_id UUID? → Placement
  status              string          // available | deployed | maintenance | retired
  last_heartbeat      timestamp?
  firmware_version    string?
  created_at          timestamp
  updated_at          timestamp
}
```

### TelemetryEvent
High-volume data point emitted by a machine during an event.

```
TelemetryEvent {
  id                  UUID
  machine_instance_id UUID → MachineInstance
  event_id            UUID → Event
  event_type          string          // play_started | play_completed | lead_captured | prize_awarded | heartbeat | error
  payload_json        JSON
  timestamp           timestamp
  external_event_id   string?         // unique; sender-side idempotency key so a Cloud webhook redelivery is a no-op. NULL (and NULLs stay distinct) for rows not ingested from a webhook — see docs/10-integrations.md §1a
}
```

### Lead
Contact information captured via a machine interaction.

```
Lead {
  id                  UUID
  event_id            UUID → Event
  machine_instance_id UUID? → MachineInstance
  contact_name        string?
  contact_email       string?
  contact_phone       string?
  custom_fields_json  JSON
  source              string          // free text, DB default 'game'; inbound Cloud webhook writes 'webhook' (also seen: manual, import)
  captured_at         timestamp
  consented_at        timestamp?      // GDPR consent stamp (Jul 2026); leads purged by /api/cron/purge-leads after the event's retention window
}
```

### EventMetricsSnapshot
Aggregated daily metrics for an event, upserted by the refresh action.

```
EventMetricsSnapshot {
  id                  UUID
  event_id            UUID → Event
  snapshot_date       date            // unique per event+date
  total_plays         integer
  total_interactions  integer
  total_leads         integer
  total_prizes        integer
  avg_dwell_time      numeric?
  peak_hour           integer?
  stock_remaining     integer?        // live prize stock (Jul 2026), recomputed on telemetry ingest
  stock_capacity      integer?        // from product_configurations.total_units
  custom_json         JSON
  created_at          timestamp
  updated_at          timestamp
}
```

### HourlyMetrics
Per-hour aggregated play and lead counts for an event, populated by the
`report.ready` webhook handler.

```
HourlyMetrics {
  id                  UUID
  event_id            UUID → Event
  snapshot_date       date
  hour                integer (0–23)
  plays               integer
  leads               integer
  created_at          timestamp
  UNIQUE (event_id, snapshot_date, hour)
}
```

### StudioPricing
Database-driven pricing tiers for Bright.Studio creative services,
replacing the hardcoded `STATIC_TIERS` / `VIDEO_TIERS` arrays.

```
StudioPricing {
  id                  UUID
  service_type        text ('design' | 'animation')
  tier_name           text
  description         text?
  price_gbp           numeric(10,2)
  price_label         text
  price_unit          text
  features            text[]
  turnaround_days     integer?
  revisions_included  integer?
  is_express          boolean
  is_featured         boolean
  sort_order          integer
  created_at          timestamp
}
```

### Schema Fixes (migration `20260527100000`)
- Added `hourly_metrics` table (above)
- Added `is_final` boolean column to `event_metrics_snapshot`
- Fixed `studio_pricing` RLS policies to use `is_internal_user()`

---

## Partner Entities (Phase 6)

### Partner
An organisation that refers or resells business, or that hosts machines.

The five tiers split into two groups. `referral`, `reseller` and `agency` are
self-service: anyone can apply through `/partners/join`, and all three share the
`/partners/:slug` portal (referral link, attributed quotes, commissions).
`venue` and `organizer` carry inventory tooling — placement boards, slot
inventory, show management — and their own portals, so they are only ever
created internally. `partnerApplicationSchema` enforces that split; a public
applicant cannot ask to be either.

```
Partner {
  id                    UUID
  name                  text
  slug                  text (unique)
  type                  text            // 'referral' | 'reseller' | 'agency' | 'venue' | 'organizer'
  contact_name          text?
  contact_email         text?
  logo_url              text?
  brand_color           text?
  partner_code          text (unique)   // e.g. 'BB-SMITH'
  commission_model_json JSON            // { type, rate }
  status                text            // 'pending' | 'active' | 'suspended' | 'inactive'
  onboarded_at          timestamp?
  created_at            timestamp
  updated_at            timestamp
}
```

### PartnerUser
Links a user profile to a partner organisation.

```
PartnerUser {
  id          UUID
  partner_id  UUID → Partner
  profile_id  UUID → Profile
  role        text            // 'member' | 'admin'
  created_at  timestamp
  UNIQUE (partner_id, profile_id)
}
```

### PartnerAttribution
Tracks a partner-attributed quote and its commission payment lifecycle.

```
PartnerAttribution {
  id                UUID
  partner_id        UUID → Partner
  quote_id          UUID? → Quote
  event_id          UUID? → Event
  commission_amount numeric?
  commission_status text            // 'pending' | 'approved' | 'paid'
  paid_at           timestamp?
  created_at        timestamp
  updated_at        timestamp
}
```

---

## Indexes and Query Patterns

Every pattern below is backed by a real index. `20260731000001_hot_path_indexes.sql`
converted the hot ones from single-column to composite (parent + sort column),
since a list that filters by event and orders by date otherwise still sorts
every matching row — see the measurements in
[`docs/13-dev-handover-priorities.md`](./13-dev-handover-priorities.md#query-performance-indexes-and-counts).
When you add a query, check that the leading columns of some index match its
`WHERE` columns and that its `ORDER BY` follows them.

### Primary Queries
- Events by account (customer dashboard)
- Events by stage (internal pipeline view)
- Events by health status (risk management)
- Tasks by event + status (task management)
- Tasks by assignee (my tasks view)
- Assets by event + status (asset management)
- Approvals by event + status (approval queue)
- Audit entries by event (audit trail)
- Notifications by user + is_read (notification centre)
- Messages by event (event messaging thread)
- QA items by event + status (QA checklist)
- Logistics entries by event + status (logistics tracker)
- Event templates by type + package (template picker)

### Telemetry Queries
- Machine instances by event (live event dashboard)
- Machine instance by serial number (heartbeat/telemetry ingest)
- Telemetry events by event + type (live feed, filtering)
- Telemetry events by timestamp range (daily aggregation)
- Leads by event (lead export, count)
- Event metrics by event + snapshot_date (reporting charts)

### Partner Queries
- Partners list (internal admin dashboard)
- Partner by slug (partner detail page)
- Partner by code (attribution lookup during quoting)
- Partner for user (resolve which partner a logged-in user belongs to)
- Attributions by partner (commission history)
- Commission summary by partner (aggregate totals: earned, pending, paid)

### Computed Fields
- `event.health_status` — derived from task due dates, blocker count, stage progression unless overridden
- `event.completion_percentage` — derived from milestone completion
- `milestone.status` — derived from child task completion
- `stage.can_advance` — derived from exit gate conditions

---

## Phase 7/8 + May–Jun entities (concise)

The entity blocks above cover the original delivery core. Later migrations added
venue/runway, commercial, compliance, config, and integration tables. For column-level
detail, RLS notes, and migration provenance, treat
[`docs/11-cloud-handoff.md`](./11-cloud-handoff.md) as authoritative.

| Entity / table | Purpose |
|----------------|---------|
| `venues` | Host locations; partner-owned scoping |
| `placements` | A machine at a venue for a date range. Aug 2026 (venue yield engine): + SKU-register columns `sku_code` (venue-scoped unique, e.g. WES-ST-01), `location_label`, `footfall_estimate` (venue-stated marketing figure), `max_slots_per_sponsor` (enforced in `reserveSlot`), and `sku_status` (`draft`/`live` — the venue approval step; only `live` placements appear on the public advertise page and widget, and pre-register rows were backfilled `live`). The untyped `pricing_model_json` is now parsed app-side into a typed revenue model (`src/lib/venues/revenue-model.ts`): `revenue_share` / `fixed_fee` / `guarantee_overage` (guarantee vs share, whichever is greater) |
| `sponsorship_slots` | Bookable sponsor windows. Dual-scoped since Jul 2026: either a venue `placement_id` **or** an `event_id` + `machine_instance_id` (an organizer selling one machine at their show). Show slots add `sponsor_name`, `pitch_token` (unique) and `pitch_token_expires_at` for the public pitch page. Aug 2026 (organizer sales engine): + `wholesale_price` (what Bright.Blue invoices the organizer; the spread against `price` is their margin), `hold_expires_at` (countdown hold — a reserved slot with a lapsed hold reads as available at query time, no sweep cron), `pitch_view_count` / `pitch_last_viewed_at` (aggregate pitch-link opens, no visitor identity) |
| `deal_registrations` | Channel-protection ledger (Aug 2026). An organizer registers a sponsor conversation before quoting it; internal review inside a 24 h SLA; approval starts a 14-day `exclusivity_expires_at` window on that company across every channel. `source` is `organizer` (partner-filed) or `reverse` (inbound brand lead pushed to an organizer as a pre-approved deal, linked via `quote_id`). Status: `pending` / `approved` / `rejected` (+ `converted`; an approved row past its window reads as `expired` at query time). RLS: partners see and insert only their own rows; internal roles manage all |
| `campaigns` / `campaign_events` | Multi-event campaign grouping |
| `invoices` | Issued invoices (no in-portal card payments) |
| `compliance_documents` | Per-event insurance / DPA / RAMS (with expiry) |
| `game_configurations` | Game setup (prizes, form fields, params). Jul 2026: + `capture_rules_json` (business-email / blocklist / dedupe / consent rules), `retention_days` (lead retention window, default 60), `branded_landing`, `capture_method` (`form` / `badge_scan` / `both`). **Scope changed**: no longer one row per event — `machine_instance_id` NULL is the show-wide default and a non-NULL row overrides one unit. Uniqueness is an expression index on `(event_id, coalesce(machine_instance_id, <sentinel>))`, so writes read-then-write instead of `upsert` |
| `product_configurations` | Product/sampling + machine config JSON. Same default-plus-override scoping as `game_configurations` |
| `scheduled_exports` | Recurring report/export schedules |
| `event_team_members` | Customer-added teammates (pending / approved / removed) |
| `comments` | Threaded comments on event or asset. Aug 2026: + `asset_version_id` (nullable FK) — comments bind to the version they were posted on; thread UI shows "on vN" chips when it differs from the current version |
| `notification_preferences` | Per-user / per-kind in-portal + email mode |
| `case_studies` | Public portfolio pieces. Aug 2026: + `publication_rights` (`named` / `anonymised` / `aggregate_only`) and `anonymised_label` — public queries route through `applyPublicationRights()` (`src/lib/publication-rights.ts`), which excludes `aggregate_only` rows and scrubs the client's name from name/title/description for `anonymised` ones (Costa Coffee ships anonymised as "A global coffee chain") |
| `pipedrive_outbox` | Durable CRM write-back queue (hourly drain) |
| `post_play_journeys` | Aug 2026 (measurement engine). The branded follow-up a verified lead receives on capture: `kind` (`where_to_buy` / `review` / `discount`), headline/body/CTA, optional `discount_code`, `is_active` (one active journey per event drives the send from `src/server/journeys.ts`). Internal-configured; customers read their own via event scoping |
| `journey_touches` | Per-lead journey funnel: `touch` (`sent` / `opened` / `clicked` / `redeemed`), unique per (journey, lead, touch) — the send-idempotency and repeat-hit guard. Opens/clicks recorded by the public tracking route `/api/journeys/track` (capability = the unguessable UUID pair; redirect target resolved server-side, never from the URL) |

Also changed for organizer shows (Jul 2026): `partners.type` accepts
`organizer`; `events.organizer_partner_id` links a show to the producer running
it; `machine_instances` gains `zone` (free text) and `mission` (`lead_capture`,
`sponsor_activation`, `welcome_gift`, `rebook_reward`, `sampling`). RLS lets an
organizer read their own shows, fleet, slots, and aggregate telemetry — and
deliberately **not** `leads`, which stay with the brand that captured them
(`supabase/tests/rls_organizers.test.sql`).

The `machines` catalogue gained site requirements in the same month
(`20260727000003_machine_site_requirements.sql`): `footprint_mm`, `weight_kg`,
`power_spec`, `connectivity` and `clearance_notes`. The catalogue already
described what a machine *does*; these describe what it *needs* to stand
somewhere, which is the half every exhibition venue asks an organizer for weeks
before move-in. They are free text (except the numeric weight) because they are
quoted verbatim into venue paperwork. **The seeded values are indicative
placeholders, not measured figures** — every surface says so, and replacing them
with the manufacturer's data is an owner task (`OWNER-TODO.md`).

Organizers also read `assets` where `customer_visible = true` on their own shows
(`20260727000004_organizer_asset_reads.sql`), which is what lets them attach
sponsor creative to a slot and see whether artwork has cleared review. SELECT
only: uploading and approving artwork stays with the brand supplying it and the
creative team reviewing it.

Those rows are all written from `/admin/organizers` rather than by hand: an
organizer `partners` row, the `profiles` + `partner_users` pair that gets their
team in, `events.organizer_partner_id`, and `machine_instances.current_event_id`
(cleared with `zone` and `mission` on release). Writes go through the internal
session client, since `is_internal_user()` write policies already cover all four
tables — see `src/app/actions/organizer-admin.ts`.

Aug 2026 measurement-engine column additions (`20260805000000`): `leads` gains
`email_status` (`unchecked` / `verified` / `disposable` / `invalid` — syntax +
disposable-domain screen at ingest; "verified leads" are reported separately)
and `is_repeat_player` (an earlier lead at the same event already carries this
email). `events` gains `live_share_token` (unique partial index) +
`live_share_expires_at` for the view-only public live dashboard at
`/live/:token`. `webhook_subscriptions` gains `event_id` — event-scoped
real-time lead delivery to a brand's CRM (see `docs/10-integrations.md`).
`campaigns.aggregate_metrics_json` is now actually written: recomputed by
`src/server/campaign-rollup.ts` on membership changes and by the reports cron.
The `telemetry_events.event_type` CHECK now includes the two capture-quality
types (`capture_rejected_domain`, `capture_duplicate_blocked`) that were being
streamed but not admitted by the constraint.

Related tables also documented in the cloud handoff (not duplicated here):
`venue_packages`, `venue_requirements`, `client_compliance_requirements`,
`account_payment_preferences`, `pipedrive_config`, `hourly_metrics`, `studio_pricing`.
