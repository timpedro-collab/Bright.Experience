# Roles & Permissions Matrix

## Role Definitions

| Role | Type | Description |
|------|------|-------------|
| Customer User | External | Views event progress, uploads assets, completes forms, approves items |
| Customer Admin | External | All Customer User permissions + manages customer team, views full reporting |
| Events Lead | Internal | Owns event lifecycle, manages milestones, coordinates across all teams |
| Creative Lead | Internal | Manages creative workflow, asset review, Bright.Studio fulfillment |
| Operations Lead | Internal | Manages logistics, product/prize readiness, venue coordination |
| QA / Config Lead | Internal | Manages machine configuration, testing, pre-event readiness |
| Developer | Internal | Handles custom development, technical configuration tasks |
| Reporting / Admin | Internal | System administration, report generation, data exports, user management |

---

## Permissions Matrix

### Legend
- ✅ Full access
- 👁 View only
- ❌ No access
- 📝 Own items only

| Capability | Customer User | Customer Admin | Events Lead | Creative Lead | Ops Lead | QA Lead | Developer | Admin |
|------------|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **Event Overview** | 👁 | 👁 | ✅ | 👁 | 👁 | 👁 | 👁 | ✅ |
| **Milestone Timeline** | 👁 | 👁 | ✅ | 👁 | 👁 | 👁 | 👁 | ✅ |
| **Customer Tasks** | 📝 | ✅ | ✅ | 👁 | 👁 | ❌ | ❌ | ✅ |
| **Internal Tasks** | ❌ | ❌ | ✅ | 📝 | 📝 | 📝 | 📝 | ✅ |
| **Asset Upload** | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ |
| **Asset Review** | ❌ | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ |
| **Approvals (submit)** | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Approvals (request)** | ❌ | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ |
| **Bright.Studio Requests** | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ |
| **Product/Prize Tracker** | ❌ | ❌ | ✅ | ❌ | ✅ | ✅ | ❌ | ✅ |
| **QA Checklist** | ❌ | ❌ | 👁 | ❌ | 👁 | ✅ | 👁 | ✅ |
| **Scope Change Requests** | 👁 | 👁 | ✅ | 👁 | 👁 | ❌ | ❌ | ✅ |
| **Internal Notes** | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Customer-Visible Updates** | 👁 | 👁 | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Reporting Dashboard** | 👁 | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Data Exports** | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Event Health Override** | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ |
| **User Management** | ❌ | 📝 | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Event Templates** | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Notifications Settings** | 📝 | 📝 | 📝 | 📝 | 📝 | 📝 | 📝 | ✅ |

---

## Visibility Rules

### Customer-Facing Content
Customers see:
- Event overview (name, dates, venue, package, stage, health)
- Milestone timeline (high-level progress)
- Their required actions and due dates
- Asset upload center with requirements
- Approval items with preview and feedback
- Bright.Studio request catalog and status
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

### Audit Trail
All of the following create immutable audit records:
- Approval decisions (who approved/rejected, when, feedback)
- Stage transitions (who triggered, when, conditions met)
- Scope change requests (who requested, cost, approval chain)
- Asset uploads and replacements (who uploaded, when, version)
- Health status overrides (who changed, from/to, reason)
