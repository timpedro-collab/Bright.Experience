# Event Lifecycle — Stages, Milestones, and Gates

## Stage Model

Every event progresses through a defined sequence of stages. Each stage has:
- Entry conditions (what must be true to enter)
- Required tasks (what must be completed within)
- Exit gate (what must be approved/complete to advance)
- Ownership (who is responsible)
- Customer visibility (what the customer sees)

---

## Stage 0: Event Confirmed
**Trigger:** Contract signed, event created in portal
**Owner:** Events Lead
**Customer sees:** Welcome message, event overview, timeline preview

### Tasks
- [ ] Event record created with all core details
- [ ] Customer users invited to portal
- [ ] Event template applied (if applicable)
- [ ] Kickoff meeting scheduled

### Exit Gate
- Kickoff meeting date confirmed

---

## Stage 1: Kickoff Complete
**Trigger:** Kickoff meeting held
**Owner:** Events Lead
**Customer sees:** Updated timeline, required actions list populated

### Tasks
- [ ] Kickoff meeting completed
- [ ] Customer briefing form sent
- [ ] Creative requirements defined
- [ ] Asset upload requirements published
- [ ] Key dates confirmed
- [ ] Internal task assignments created

### Exit Gate
- Customer briefing form submitted
- All internal task owners assigned

---

## Stage 2: Creative & Assets
**Trigger:** Kickoff complete, asset requirements published
**Owner:** Creative Lead + Customer
**Customer sees:** Asset checklist, upload center, format requirements, due dates

### Tasks
- [ ] Customer uploads brand assets (logos, guidelines, imagery)
- [ ] Customer completes webform question brief
- [ ] Customer provides prize/product details
- [ ] Creative team reviews assets for quality/format
- [ ] Wrap design created (if applicable)
- [ ] Game flow/UX designed
- [ ] Webform designed
- [ ] Bright.Studio requests submitted and fulfilled (if applicable)

### Exit Gate
- All required assets received and accepted
- Creative deliverables ready for approval

---

## Stage 3: Approvals
**Trigger:** Creative deliverables ready
**Owner:** Events Lead (orchestrator), Customer (approver)
**Customer sees:** Items pending approval with preview, approve/reject with feedback

### Tasks
- [ ] Wrap design approved
- [ ] Game flow approved
- [ ] Webform approved
- [ ] Custom development approved (if applicable)
- [ ] Final messaging/copy approved

### Exit Gate
- All approval items resolved (approved or revised and re-approved)

---

## Stage 4: Build & Configuration
**Trigger:** All approvals complete
**Owner:** QA/Config Lead + Developer
**Customer sees:** "Configuration in progress" status, expected completion date

### Tasks
- [ ] Machine configuration started
- [ ] Game logic implemented
- [ ] Webform built and connected
- [ ] Wrap production initiated
- [ ] Product/prize sample received and tested
- [ ] Vending mechanism configured (if applicable)
- [ ] Custom development completed (if applicable)

### Exit Gate
- Configuration complete, ready for QA

---

## Stage 5: QA & Readiness
**Trigger:** Build complete
**Owner:** QA/Config Lead
**Customer sees:** "Quality check in progress" status

### Tasks
- [ ] Machine configuration verified
- [ ] Game logic tested (all paths)
- [ ] UX/UI tested across scenarios
- [ ] Webform tested (submission, validation, data capture)
- [ ] Wrap installed and inspected
- [ ] Product/prize vending tested
- [ ] Logistics confirmed (delivery, collection, onsite contact)
- [ ] Refill/stock plan confirmed
- [ ] Final readiness checklist complete

### Exit Gate
- QA checklist 100% complete
- Final signoff from QA Lead
- Final signoff from Events Lead

---

## Stage 6: Logistics Confirmed
**Trigger:** QA complete
**Owner:** Operations Lead
**Customer sees:** Logistics confirmation, onsite contact details, event day brief

### Tasks
- [ ] Delivery date and time confirmed
- [ ] Collection date and time confirmed
- [ ] Onsite contact confirmed (Bright.Blue)
- [ ] Onsite contact confirmed (Customer)
- [ ] Venue access details confirmed
- [ ] Event day brief prepared
- [ ] Staffing confirmed (if applicable)

### Exit Gate
- All logistics fields complete
- Customer confirms onsite details

---

## Stage 7: Event Live
**Trigger:** Event date reached, all readiness confirmed
**Owner:** Operations Lead
**Customer sees:** "Event is live" status, real-time updates (if available)

### Tasks
- [ ] Machine deployed and operational
- [ ] Onsite issues logged (if any)
- [ ] Real-time monitoring active (if applicable)

### Exit Gate
- Event concluded

---

## Stage 8: Reporting
**Trigger:** Event concluded
**Owner:** Reporting / Admin
**Customer sees:** Reporting dashboard, export tools, event summary

### Tasks
- [ ] Data collected and processed
- [ ] Report generated
- [ ] Report published to customer portal
- [ ] Exports available (CSV, XLSX)
- [ ] Event summary prepared
- [ ] Next-action prompts displayed

### Exit Gate
- Customer has accessed report (or 30-day auto-close)

---

## Stage 9: Complete
**Trigger:** Reporting delivered
**Owner:** Events Lead
**Customer sees:** Event summary, rebooking prompts, archive access

### Tasks
- [ ] Debrief offered
- [ ] Repeat activation discussed
- [ ] Event archived

---

## Health Status Model

At any point, an event carries a health status:

| Status | Meaning | Trigger |
|--------|---------|---------|
| **Green** | On track | All tasks on schedule, no blockers |
| **Amber** | At risk | Overdue task, pending approval > 3 days, missing asset near deadline |
| **Red** | Blocked | Critical dependency unresolved, QA failure, logistics unconfirmed < 48h before event |

Health status is calculated automatically based on task states, due dates, and stage progression rules, with manual override available for Events Lead.
