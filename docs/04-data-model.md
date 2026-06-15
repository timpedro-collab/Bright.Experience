# Core Data Model

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
  status          enum            // draft | submitted | quoted | approved | in_progress | delivered | cancelled
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
Post-event reporting data.

```
Report {
  id              UUID
  event_id        UUID → Event
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
  current_placement_id UUID?
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
  source              string          // game | manual | import
  captured_at         timestamp
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
A reseller, venue, or agency organisation that refers business.

```
Partner {
  id                    UUID
  name                  text
  slug                  text (unique)
  type                  text            // 'reseller' | 'venue' | 'agency'
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
