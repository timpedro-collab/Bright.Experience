# MVP Information Architecture

## URL Structure

### Customer Views
```
/                                   → Dashboard (my events)
/events/:id                         → Event workspace
/events/:id/timeline                → Milestone timeline
/events/:id/actions                 → Required actions / checklist
/events/:id/assets                  → Asset upload center
/events/:id/approvals               → Approvals center
/events/:id/studio                  → Bright.Studio requests
/events/:id/reports                 → Reporting dashboard
/events/:id/reports/export          → Export tools
```

### Internal Views
```
/internal                           → Internal dashboard (all events)
/internal/events/:id                → Event workspace (internal view)
/internal/events/:id/tasks          → Full task management
/internal/events/:id/qa             → QA / readiness checklist
/internal/events/:id/operations     → Operations view (product, logistics)
/internal/events/:id/scope          → Scope change tracker
/internal/events/:id/notes          → Internal notes
/internal/events/:id/audit          → Audit trail
/internal/events/:id/reports        → Reporting with admin controls
```

### Admin Views
```
/admin/templates                    → Event template manager
/admin/users                        → User management
/admin/accounts                     → Account management
```

---

## Navigation Model

### Customer Navigation
Primary (sidebar):
1. **My Events** — list of events for this account
2. Per-event (when inside an event):
   - Overview
   - Timeline
   - Actions
   - Assets
   - Approvals
   - Studio
   - Reports

### Internal Navigation
Primary (sidebar):
1. **All Events** — filterable pipeline of all events
2. **My Tasks** — tasks assigned to current user
3. Per-event (when inside an event):
   - Overview
   - Timeline
   - Tasks
   - Assets
   - Approvals
   - Studio
   - Operations
   - QA
   - Scope
   - Notes
   - Reports
   - Audit

### Global
- Notifications (bell icon)
- User profile / settings
- Role switcher (for testing/demo, admin only)

---

## Page Hierarchy — MVP Screens

### Screen 1: Dashboard / Event List
**Customer:** Shows all events for their account with stage, health, next action.
**Internal:** Shows all events across all accounts with filters for stage, health, owner, date.

Key elements:
- Event cards with: name, customer, date, stage badge, health indicator
- Sort by: date, stage, health
- Filter by: stage, health, account (internal only)
- Quick action: open event

### Screen 2: Event Overview
The "home page" of an event workspace.

Key elements:
- Event header: name, customer, type, dates, venue, package, machine
- Current stage with progress indicator
- Health status badge
- Milestone timeline (compact)
- Required actions summary (top 3–5 items)
- Recent activity feed
- Quick links to sub-sections

### Screen 3: Milestone Timeline
Visual timeline showing all stages and milestones.

Key elements:
- Vertical timeline with stage grouping
- Each milestone: name, status, target date, completion date
- Current stage highlighted
- Future stages shown but muted
- Customer sees simplified version (no internal milestones)

### Screen 4: Required Actions / Checklist
Customer's clear list of what they need to do.

Key elements:
- Grouped by status: overdue, due soon, upcoming, completed
- Each item: title, description, due date, status, action button
- Action types: upload asset, complete form, approve item, provide info
- Progress bar showing completion

### Screen 5: Asset Upload Center
Where customers upload required materials.

Key elements:
- Asset slots with requirements (format, dimensions, due date)
- Upload dropzone per slot
- Status per asset: required, uploaded, under review, accepted, rejected
- Rejection feedback inline
- Version history (replace capability)
- Bulk upload support

### Screen 6: Approvals Center
Where customers review and approve deliverables.

Key elements:
- Approval cards with preview
- Approve / reject with feedback
- History of decisions
- Pending count badge
- Revision tracking

### Screen 7: Bright.Studio Request Page
Creative services marketplace and request flow.

Key elements:
- Service catalog with descriptions and indicative pricing
- Request form with brief and reference uploads
- Request status tracking
- Delivered assets accessible from here

### Screen 8: Internal Operations View
Internal-only operational controls.

Key elements:
- Product/prize readiness tracker
- Logistics status
- Scope change requests
- Internal notes (separate from customer updates)

### Screen 9: QA / Readiness View
Pre-event quality checklist.

Key elements:
- Checklist grouped by category
- Pass/fail/fixed status per item
- Failure notes and fix tracking
- Overall readiness score
- Final signoff buttons

### Screen 10: Reporting Dashboard
Post-event results.

Key elements:
- Key metrics: interactions, entries, leads, completion rate, opt-ins
- Prize/sample distribution
- Custom question results
- Time/date breakdowns
- Export buttons (CSV, XLSX)
- Event summary card
- Next-action prompts

---

## Component Architecture (Reusable)

### Layout Components
- `AppShell` — sidebar + main content area
- `Sidebar` — navigation with role-based menu items
- `PageHeader` — title, breadcrumb, actions
- `SectionCard` — glass card container for content groups

### Data Display
- `StatusBadge` — stage, health, task status
- `ProgressTimeline` — vertical milestone timeline
- `DataTable` — sortable, filterable table
- `KpiCard` — metric display card
- `ActivityFeed` — chronological event list
- `EmptyState` — helpful empty state with action

### Input Components
- `FileUpload` — drag-and-drop with requirements
- `ApprovalCard` — preview + approve/reject
- `TaskChecklistItem` — checkbox with metadata
- `FormField` — label + input + validation

### Feedback
- `Toast` — notification toasts
- `HealthIndicator` — green/amber/red dot with label
- `ProgressBar` — completion percentage
- `Skeleton` — loading placeholders
