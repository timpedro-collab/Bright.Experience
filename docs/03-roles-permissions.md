# Roles & Permissions

> **This document describes the model the code actually enforces.** The single
> source of truth is `src/lib/roles.ts` (role-class helpers and back-office
> ownership) plus `src/lib/event-access.ts` (which event sections each role can
> see — driving both the tab navigation and the per-page server guards).
> If this document and those modules ever disagree, the modules win — update
> this file.

## Role Definitions

| Role | Type | Description |
|------|------|-------------|
| `customer_user` | External | Brand-side contributor: views event progress, uploads assets, completes their own tasks, submits approvals |
| `customer_admin` | External | The client's lead contact: everything `customer_user` has + manages the customer team (`/settings/team`), orders Bright.Studio work, full reporting/exports |
| `events_lead` | Internal | Orchestrator / account manager: owns the event lifecycle, advances stages, sees every section and all commercial surfaces |
| `creative_lead` | Internal | Creative team: asset review queue, Bright.Studio fulfilment, catalog/creative back-office, game/prize configuration |
| `operations_lead` | Internal | Logistics: delivery, machine build, compliance, QA readiness, locations back-office |
| `qa_lead` | Internal | Pre-event readiness: QA sign-off, config verification (read-only machine view) |
| `admin` | Internal | System owner: everything, including user management, API keys, invites, accounts, Pipedrive |
| `partner_member` | Partner | Reseller/agency staff (or venue operator when `partner.type === "venue"`): their own co-branded portal only, data-scoped by partner slug |
| `partner_admin` | Partner | Partner org lead: `partner_member` + commission management on the partner portal |

Notes:

- **Venue operators are not a separate role.** A venue is a partner org with
  `type === "venue"`; its members hold `partner_member` / `partner_admin` and
  are routed to the venue portal instead of the reseller portal.
- **Sensitive admin surfaces** (Users, API/integrations, Invites, Accounts,
  Pipedrive) are gated by `isAdminRole()`, which admits `admin` **and**
  `events_lead` — a deliberate small-org choice.

## Enforced helpers (`src/lib/roles.ts`)

| Helper | Grants | Who |
|--------|--------|-----|
| `isInternalRole` | "Is this a Bright.Blue employee?" — first-line gate everywhere | all internal roles |
| `isAdminRole` | Sensitive admin surfaces (users, API keys, invites, accounts) | `admin`, `events_lead` |
| `canAdvanceEventStage` | Move an event through the delivery pipeline | `events_lead`, `admin` |
| `canReviewCreativeAssets` | Approve / request revision / hand to Studio | `creative_lead`, `admin` |
| `canViewCreativeQueue` | Open the creative review queue (read-only oversight for the lead) | reviewers + `events_lead` |
| `canRecordApprovalOnBehalf` | Record customer sign-off on the customer's behalf | `events_lead`, `creative_lead`, `admin` |
| `canViewCommercial` | Quotes, invoices, customer queue, templates, campaigns, benchmarks, partners | `events_lead`, `admin` |
| `canViewCreativeProduct` | Catalog back-office + Studio orders page | `creative_lead`, `events_lead`, `admin` |
| `canViewLocations` | Locations (venues / delivery addresses) back-office | `operations_lead`, `events_lead`, `admin` |
| `canOrderStudioWork` | Raise a Bright.Studio order (commercial commitment) | internal roles + `customer_admin` |
| `isPartnerRole` | Partner portal routing and guards | `partner_member`, `partner_admin` |
| `isPartnerAdmin` | Commission management on the partner portal | `partner_admin` |

Event-section visibility (which tabs a role sees, and the matching server
redirect) lives in `src/lib/event-access.ts` — see `visibleSectionsForRole()`
and `canViewSection()`. Customers see their journey (13 sections, grouped into
four phases); `customer_admin` additionally gets the Studio tab; Creative, Ops
and QA get focused lanes; `events_lead` and `admin` see everything.

## Visibility Rules

### Customer-Facing Content
Customers see:
- Event overview (name, dates, venue, package, stage, health)
- Milestone timeline (high-level progress)
- Their required actions and due dates
- Asset upload center with requirements
- Approval items with preview and feedback
- Bright.Studio request catalog and status (ordering reserved for `customer_admin`)
- Post-event reporting dashboard
- Customer-visible updates and notifications

### Customer Never Sees
- Internal task assignments
- Internal notes
- Cost/margin information on scope changes
- QA failure details (only "in progress" / "complete")
- Internal health status overrides
- Product/prize testing details
- Staffing assignments
- Internal deadlines vs customer-facing deadlines
- The Activity (audit) feed

### Audit Trail
All of the following create immutable audit records:
- Approval decisions (who approved/rejected, when, feedback)
- Stage transitions (who triggered, when, conditions met)
- Scope change requests (who requested, cost, approval chain)
- Asset uploads and replacements (who uploaded, when, version)
- Health status overrides (who changed, from/to, reason)

## Deliberate deferrals

Personas that do **not** exist yet, by choice:

- **Finance / billing role** — invoicing stays with account managers; the
  in-portal invoice surface is display-only.
- **Read-only executive / stakeholder role** — portfolio-wide visibility
  without mutation rights.
- **Sponsor / advertiser login** — venue sponsorship slots are sold and
  managed concierge-style until a real venue deal shapes the requirement.
