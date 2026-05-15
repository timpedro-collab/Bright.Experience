# Stage-by-Stage Build Roadmap

## Build Principles
- Ship the highest-leverage screens first
- Every stage must be usable on its own
- Components built in early stages must be reusable in later stages
- Do not build automation until the manual workflow is stable
- Do not build analytics until core delivery flow works

---

## Stage 1: Core Event Workspace MVP
**Goal:** Replace fragmented post-sale coordination with one workspace.
**Timeline:** First build priority

### What gets built
1. Project scaffolding (Next.js, Tailwind, design system tokens)
2. `AppShell` layout with sidebar navigation
3. Dashboard / event list page
4. Event overview page
5. Milestone timeline component and page
6. Required actions / checklist page
7. Role-based navigation (customer vs internal)
8. Health status indicators
9. Mock data layer for development

### What this unlocks
- Customer can see their event and what's needed
- Internal team has a single event view
- Foundation for all subsequent screens

---

## Stage 2: Asset Collection & Approvals
**Goal:** Remove email-based asset chasing and approval ambiguity.
**Depends on:** Stage 1

### What gets built
1. Asset upload center with structured requirements
2. File upload component with drag-and-drop
3. Asset review workflow (accept/reject with feedback)
4. Approval cards with preview
5. Approval flow (request → review → approve/reject → revision)
6. Bright.Studio request page and flow
7. Customer briefing forms

### What this unlocks
- Customer uploads assets in one place
- Creative team reviews without email
- Approvals have clear audit trail
- Bright.Studio upsell path exists

---

## Stage 3: Internal Operations Layer
**Goal:** Give the internal team operational depth.
**Depends on:** Stage 1

### What gets built
1. Internal task management view
2. Product/prize readiness tracker
3. QA checklist system with pass/fail/fix
4. Scope change request flow
5. Internal notes (separated from customer view)
6. Event health calculation logic
7. Audit trail view

### What this unlocks
- QA becomes systematic, not memory-based
- Scope changes are tracked and priced
- Internal team has operational controls

---

## Stage 4: Notifications & Automation
**Goal:** Reduce manual chasing and follow-up.
**Depends on:** Stages 1–3 stable

### What gets built
1. Notification system (in-app)
2. Automated reminders (assets due, approvals pending)
3. Stage progression rules (auto-advance when conditions met)
4. Health status auto-calculation
5. Email notification integration (optional)

### What this unlocks
- Less manual follow-up
- Events auto-progress when ready
- Risk surfaces automatically

---

## Stage 5: Reporting & Export
**Goal:** Close the loop with premium post-event reporting.
**Depends on:** Stage 1

### What gets built
1. Reporting dashboard with key metrics
2. Custom question results display
3. Time/date breakdowns
4. CSV and XLSX export
5. Event summary view
6. Next-action prompts (debrief, rebook)

### What this unlocks
- Reporting lives in the same portal
- Customer gets premium post-event experience
- Rebooking conversation starts naturally

---

## Stage 6: Scale Features
**Goal:** Support volume, repeat customers, and portfolio views.
**Depends on:** Stages 1–5

### What gets built (later)
1. Multi-event account view
2. Event templates and cloning
3. Agency portfolio dashboard
4. Benchmark analytics
5. Reusable asset libraries
6. Internal performance analytics

---

## Current Build Focus

**We are building Stage 1.**

The immediate deliverables are:
1. ✅ Product definition
2. ✅ Event lifecycle model
3. ✅ Roles and permissions matrix
4. ✅ Core data model
5. ✅ Information architecture
6. ✅ Build roadmap
7. → Project scaffolding and design system setup
8. → Dashboard, event overview, timeline, and actions screens
