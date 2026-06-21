/**
 * Supplemental mock rows for tables the base dataset left empty.
 *
 * Kept separate from the generated `dataset.ts` so the seed transcription stays
 * pristine. `store.ts` merges these on top of `MOCK_TABLES` at load time. Every
 * row reuses IDs already present in the base dataset (events, accounts,
 * profiles, partners, venues, machine instances, packages, assets) so embedded
 * selects resolve cleanly.
 *
 * Anchor "now" ≈ 2026-06-18, matching the base dataset.
 */

export type MockRow = Record<string, unknown>;

// ── Reused base-dataset IDs ────────────────────────────────────────────────
const ACC_COKE = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
const ACC_SAMSUNG = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";

const P_SARAH = "11111111-1111-1111-1111-111111111111"; // events_lead
const P_JAMES = "22222222-2222-2222-2222-222222222222"; // customer_admin (Coca-Cola)
const P_EMMA = "33333333-3333-3333-3333-333333333333"; // creative_lead
const P_TOM = "44444444-4444-4444-4444-444444444444"; // operations_lead

const EVT_COKE_SUMMER = "e1111111-1111-1111-1111-111111111111";
const EVT_SAMSUNG_LAUNCH = "e2222222-2222-2222-2222-222222222222";
const EVT_COKE_XMAS = "e4444444-4444-4444-4444-444444444444";
const EVT_SAMSUNG_UNPACKED = "e5555555-5555-5555-5555-555555555555";
const EVT_COKE_SPRING = "e6666666-6666-6666-6666-666666666666";

const PARTNER_NORTH = "e0e0e0e0-e0e0-4e0e-8e0e-e0e0e0e0e0e0";
const PARTNER_KINGS = "e1e1e1e1-e1e1-4e1e-8e1e-e1e1e1e1e1e1";
const VENUE_MANCHESTER = "f0f0f0f0-f0f0-4f0f-8f0f-f0f0f0f0f0f0";
const VENUE_KINGS = "f1f1f1f1-f1f1-4f1f-8f1f-f1f1f1f1f1f1";

const MI_PRO1 = "1a1a1a1a-1a1a-4a1a-8a1a-1a1a1a1a1a1a";
const MI_PRO2 = "1b1b1b1b-1b1b-4b1b-8b1b-1b1b1b1b1b1b";

const PKG_VEND_DAY = "c1c1c1c1-c1c1-4c1c-8c1c-c1c1c1c1c1c1";
const PKG_VEND_WEEKEND = "c2c2c2c2-c2c2-4c2c-8c2c-c2c2c2c2c2c2";
const PKG_PLAY_5DAY = "c3c3c3c3-c3c3-4c3c-8c3c-c3c3c3c3c3c3";

const ASSET_WRAP = "a1f00000-0000-4000-8000-000000000003"; // Machine Wrap Artwork
const ASSET_BANNER = "a1f00000-0000-4000-8000-000000000009"; // Game Page Banner

// Partner-portal personas (added so you can log in as a partner/venue contact).
const P_MAYA = "66666666-6666-6666-6666-666666666666"; // Northern Events admin
const P_AARON = "77777777-7777-7777-7777-777777777777"; // Kings Cross Hall admin

// Stable IDs for cross-referenced rows.
const PL_MANCHESTER_SUMMER = "b1000000-0000-4000-8000-000000000001";
const PL_KINGS_AUTUMN = "b1000000-0000-4000-8000-000000000002";
const PL_MANCHESTER_SPRING = "b1000000-0000-4000-8000-000000000003";
const CMP_COKE = "ca000000-0000-4000-8000-000000000001";
const CMP_SAMSUNG = "ca000000-0000-4000-8000-000000000002";
const CMT_BANNER = "cc000000-0000-4000-8000-000000000001";

export const EXTRA_TABLES: Record<string, MockRow[]> = {
  // Appended to the existing profiles so partner-portal logins resolve.
  profiles: [
    { id: P_MAYA, name: "Maya Patel", email: "maya@northern.events", role: "partner_admin", account_id: null },
    { id: P_AARON, name: "Aaron Howe", email: "aaron@kingsx.london", role: "partner_admin", account_id: null },
  ],

  partner_users: [
    { id: "d0000000-0000-4000-8000-000000000001", partner_id: PARTNER_NORTH, profile_id: P_MAYA, role: "admin", created_at: "2026-01-10T10:05:00Z" },
    { id: "d0000000-0000-4000-8000-000000000002", partner_id: PARTNER_KINGS, profile_id: P_AARON, role: "admin", created_at: "2026-02-04T10:05:00Z" },
  ],

  studio_pricing: [
    { id: "e8000000-0000-4000-8000-000000000001", service_type: "design", tier_name: "Essential Enhancements", description: "Meets minimum asset standards", price_gbp: 32.0, price_label: "£32", price_unit: "Per Asset", features: ["Aspect Ratio Correction", "Size Compression", "Background Removal", "Colour Matching"], turnaround_days: 3, revisions_included: 1, is_express: false, is_featured: false, sort_order: 1, created_at: "2026-01-05T09:00:00Z" },
    { id: "e8000000-0000-4000-8000-000000000002", service_type: "design", tier_name: "Professional Enhancements", description: "Transforms assets with expert detail", price_gbp: 72.0, price_label: "£72", price_unit: "Per Asset", features: ["All in Essential", "Quality Boost", "Layout Adjustments", "Web Asset Sourcing", "Web Asset Adaptation"], turnaround_days: 5, revisions_included: 2, is_express: false, is_featured: true, sort_order: 2, created_at: "2026-01-05T09:00:00Z" },
    { id: "e8000000-0000-4000-8000-000000000003", service_type: "design", tier_name: "New Asset Creation", description: "Original assets from the ground up", price_gbp: 120.0, price_label: "£120", price_unit: "Per Asset", features: ["All in Professional", "Concept Development", "Custom Graphics", "Brand Alignment", "Original Layouts", "Multi-Format Delivery"], turnaround_days: 8, revisions_included: 3, is_express: false, is_featured: false, sort_order: 3, created_at: "2026-01-05T09:00:00Z" },
    { id: "e8000000-0000-4000-8000-000000000004", service_type: "animation", tier_name: "Essential Enhancements", description: "Meets minimum motion standards", price_gbp: 160.0, price_label: "£160", price_unit: "Per Asset", features: ["Format Conversion", "Duration Trimming", "Resolution Adjustment", "Basic Colour Correction"], turnaround_days: 4, revisions_included: 1, is_express: false, is_featured: false, sort_order: 1, created_at: "2026-01-05T09:00:00Z" },
    { id: "e8000000-0000-4000-8000-000000000005", service_type: "animation", tier_name: "Professional Enhancements", description: "Elevates existing motion assets", price_gbp: 480.0, price_label: "£480", price_unit: "Per Asset", features: ["All in Essential", "Transition Effects", "Audio Sync", "Text Overlay", "Branded Elements"], turnaround_days: 7, revisions_included: 2, is_express: false, is_featured: true, sort_order: 2, created_at: "2026-01-05T09:00:00Z" },
    { id: "e8000000-0000-4000-8000-000000000006", service_type: "animation", tier_name: "New Asset Creation", description: "Original motion from the ground up", price_gbp: 1080.0, price_label: "£1,080", price_unit: "Per Asset", features: ["All in Professional", "Concept Development", "Custom Animation", "Brand Alignment", "Original Sequences", "Multi-Format Delivery"], turnaround_days: 12, revisions_included: 3, is_express: false, is_featured: false, sort_order: 3, created_at: "2026-01-05T09:00:00Z" },
  ],

  placements: [
    { id: PL_MANCHESTER_SUMMER, venue_id: VENUE_MANCHESTER, machine_instance_id: MI_PRO1, start_date: "2026-07-01", end_date: "2026-07-31", status: "active", pricing_model_json: { model: "revenue_share", rate: 0.15, floor_gbp: 4000 }, notes: "Ground-floor atrium, peak summer footfall.", created_at: "2026-05-20T09:00:00Z", updated_at: "2026-06-18T09:00:00Z" },
    { id: PL_KINGS_AUTUMN, venue_id: VENUE_KINGS, machine_instance_id: null, start_date: "2026-09-05", end_date: "2026-09-20", status: "planned", pricing_model_json: { model: "fixed_fee", fee_gbp: 18000 }, notes: "Main hall, tied to autumn brand season.", created_at: "2026-06-01T11:00:00Z", updated_at: "2026-06-01T11:00:00Z" },
    { id: PL_MANCHESTER_SPRING, venue_id: VENUE_MANCHESTER, machine_instance_id: MI_PRO2, start_date: "2026-03-01", end_date: "2026-03-31", status: "completed", pricing_model_json: { model: "revenue_share", rate: 0.12 }, notes: "Spring pilot — converted to a recurring slot.", created_at: "2026-02-10T10:00:00Z", updated_at: "2026-04-02T10:00:00Z" },
  ],

  sponsorship_slots: [
    { id: "b2000000-0000-4000-8000-000000000001", placement_id: PL_MANCHESTER_SUMMER, sponsor_account_id: P_JAMES, start_date: "2026-07-05", end_date: "2026-07-12", price: 26000, status: "reserved", creative_asset_ids: [], game_config_json: { game: "Spin & Reveal", prize_pool: "Summer minis" }, created_at: "2026-05-22T09:00:00Z", updated_at: "2026-06-10T09:00:00Z" },
    { id: "b2000000-0000-4000-8000-000000000002", placement_id: PL_MANCHESTER_SUMMER, sponsor_account_id: null, start_date: "2026-07-15", end_date: "2026-07-22", price: 22000, status: "available", creative_asset_ids: [], game_config_json: {}, created_at: "2026-05-22T09:00:00Z", updated_at: "2026-05-22T09:00:00Z" },
    { id: "b2000000-0000-4000-8000-000000000003", placement_id: PL_KINGS_AUTUMN, sponsor_account_id: null, start_date: "2026-09-05", end_date: "2026-09-12", price: 38000, status: "available", creative_asset_ids: [], game_config_json: {}, created_at: "2026-06-01T11:05:00Z", updated_at: "2026-06-01T11:05:00Z" },
  ],

  venue_packages: [
    { id: "b3000000-0000-4000-8000-000000000001", venue_id: VENUE_MANCHESTER, name: "Pop-Up Day Rate", description: "Single-day kiosk slot with footfall reporting.", price: 1200, includes_bright_blue: true, bright_blue_package_id: PKG_VEND_DAY, sort_order: 0, created_at: "2026-02-01T09:00:00Z" },
    { id: "b3000000-0000-4000-8000-000000000002", venue_id: VENUE_MANCHESTER, name: "Weekend Takeover", description: "Fri–Sun atrium placement with branded wrap and two ambassadors.", price: 3400, includes_bright_blue: true, bright_blue_package_id: PKG_VEND_WEEKEND, sort_order: 1, created_at: "2026-02-01T09:00:00Z" },
    { id: "b3000000-0000-4000-8000-000000000003", venue_id: VENUE_KINGS, name: "Main Hall Activation", description: "Five-day premium activation in the main hall, full creative production.", price: 9500, includes_bright_blue: true, bright_blue_package_id: PKG_PLAY_5DAY, sort_order: 0, created_at: "2026-02-06T09:00:00Z" },
    { id: "b3000000-0000-4000-8000-000000000004", venue_id: VENUE_KINGS, name: "Hall Hire Only", description: "Space-only hire for partner-supplied hardware.", price: 4000, includes_bright_blue: false, bright_blue_package_id: null, sort_order: 1, created_at: "2026-02-06T09:00:00Z" },
  ],

  venue_requirements: [
    { id: "b4000000-0000-4000-8000-000000000001", event_id: EVT_SAMSUNG_LAUNCH, requirement_type: "power_spec", description: "32A single-phase supply within 10m of the activation footprint.", document_url: null, is_met: true, notes: "Confirmed with Westfield facilities.", created_at: "2026-05-30T09:00:00Z", updated_at: "2026-06-12T09:00:00Z" },
    { id: "b4000000-0000-4000-8000-000000000002", event_id: EVT_SAMSUNG_LAUNCH, requirement_type: "insurance_minimum", description: "£5m public liability cover, certificate filed 14 days pre-event.", document_url: null, is_met: false, notes: "Awaiting updated certificate from broker.", created_at: "2026-05-30T09:00:00Z", updated_at: "2026-05-30T09:00:00Z" },
    { id: "b4000000-0000-4000-8000-000000000003", event_id: EVT_SAMSUNG_LAUNCH, requirement_type: "loading_access", description: "Loading bay booking + 90-minute build slot before centre opens.", document_url: null, is_met: true, notes: "Slot booked for 06:30.", created_at: "2026-05-30T09:00:00Z", updated_at: "2026-06-05T09:00:00Z" },
    { id: "b4000000-0000-4000-8000-000000000004", event_id: EVT_SAMSUNG_UNPACKED, requirement_type: "exhibitor_manual", description: "Battersea exhibitor manual reviewed and signed off.", document_url: null, is_met: true, notes: null, created_at: "2026-03-15T09:00:00Z", updated_at: "2026-03-18T09:00:00Z" },
  ],

  comments: [
    { id: CMT_BANNER, event_id: EVT_COKE_SUMMER, asset_id: ASSET_BANNER, author_id: P_EMMA, body: "Love the energy here. Can we nudge the logo up ~40px so it clears the safe area on the portrait screen?", parent_id: null, created_at: "2026-06-16T10:15:00Z" },
    { id: "cc000000-0000-4000-8000-000000000002", event_id: EVT_COKE_SUMMER, asset_id: ASSET_BANNER, author_id: P_JAMES, body: "Good spot — updated version uploaded with the logo lifted and recoloured to the 2026 red.", parent_id: CMT_BANNER, created_at: "2026-06-17T08:40:00Z" },
    { id: "cc000000-0000-4000-8000-000000000003", event_id: EVT_COKE_SUMMER, asset_id: ASSET_WRAP, author_id: P_EMMA, body: "Wrap proof looks great. One thing — the bleed on the left panel is 2mm short for the Pro cabinet.", parent_id: null, created_at: "2026-06-15T14:05:00Z" },
    { id: "cc000000-0000-4000-8000-000000000004", event_id: EVT_COKE_SUMMER, asset_id: null, author_id: P_SARAH, body: "Team — client confirmed the on-site contact and final headcount. We're clear to lock logistics.", parent_id: null, created_at: "2026-06-18T09:30:00Z" },
    { id: "cc000000-0000-4000-8000-000000000005", event_id: EVT_SAMSUNG_LAUNCH, author_id: P_SARAH, asset_id: null, body: "Proofs are in the approvals tab for sign-off. Flagging the insurance cert is still outstanding.", parent_id: null, created_at: "2026-06-14T16:20:00Z" },
  ],

  messages: [
    { id: "ab000000-0000-4000-8000-000000000001", event_id: EVT_COKE_SUMMER, sender_id: P_JAMES, body: "Hi team — really excited to get this one moving. When do you need the final artwork by?", attachments: [], is_internal: false, topic: "general", created_at: "2026-06-12T09:10:00Z" },
    { id: "ab000000-0000-4000-8000-000000000002", event_id: EVT_COKE_SUMMER, sender_id: P_SARAH, body: "Welcome aboard! We'll need final approved assets by 1 July to stay ahead of the build. I've added the checklist to your portal.", attachments: [], is_internal: false, topic: "general", created_at: "2026-06-12T09:25:00Z" },
    { id: "ab000000-0000-4000-8000-000000000003", event_id: EVT_COKE_SUMMER, sender_id: P_EMMA, body: "James — left a couple of notes on the game banner. Quick tweak and we're good to approve.", attachments: [], is_internal: false, topic: "creative", created_at: "2026-06-16T10:20:00Z" },
    { id: "ab000000-0000-4000-8000-000000000004", event_id: EVT_COKE_SUMMER, sender_id: P_TOM, body: "Vans booked for the 14th, two ambassadors confirmed. Will share the run sheet once the wrap is signed off.", attachments: [], is_internal: true, topic: "logistics", created_at: "2026-06-17T11:00:00Z" },
    { id: "ab000000-0000-4000-8000-000000000005", event_id: EVT_SAMSUNG_LAUNCH, sender_id: P_SARAH, body: "Proofs uploaded to the approvals tab. We're blocked on the insurance certificate before we can confirm the build slot.", attachments: [], is_internal: false, topic: "compliance", created_at: "2026-06-14T16:25:00Z" },
    { id: "ab000000-0000-4000-8000-000000000006", event_id: EVT_SAMSUNG_LAUNCH, sender_id: P_TOM, body: "Internal: chasing the broker on the £5m cert. Holding the loading bay slot in the meantime.", attachments: [], is_internal: true, topic: "logistics", created_at: "2026-06-15T09:05:00Z" },
  ],

  notifications: [
    { id: "ad000000-0000-4000-8000-000000000001", user_id: P_EMMA, event_id: EVT_COKE_SUMMER, type: "asset_review", title: "Asset awaiting your review", body: "Game Page Banner (Coca-Cola Summer Festival) is ready for creative sign-off.", is_read: false, link: "/admin/asset-reviews", created_at: "2026-06-17T08:45:00Z", kind: "asset_review_requested", priority: "high", entity_type: "asset", entity_id: ASSET_BANNER, action_required: true },
    { id: "ad000000-0000-4000-8000-000000000002", user_id: P_EMMA, event_id: EVT_COKE_SUMMER, type: "asset_review", title: "Revision uploaded", body: "James Chen re-uploaded the Machine Wrap Artwork after your feedback.", is_read: false, link: "/admin/asset-reviews", created_at: "2026-06-16T12:30:00Z", kind: "asset_revision_uploaded", priority: "normal", entity_type: "asset", entity_id: ASSET_WRAP, action_required: true },
    { id: "ad000000-0000-4000-8000-000000000003", user_id: P_EMMA, event_id: EVT_SAMSUNG_LAUNCH, type: "comment", title: "New comment on Samsung Galaxy Launch", body: "Sarah Mitchell mentioned the outstanding insurance certificate.", is_read: true, link: "/events/" + EVT_SAMSUNG_LAUNCH, created_at: "2026-06-14T16:30:00Z", kind: "comment_added", priority: "normal", entity_type: "event", entity_id: EVT_SAMSUNG_LAUNCH, action_required: false },
    { id: "ad000000-0000-4000-8000-000000000004", user_id: P_SARAH, event_id: EVT_SAMSUNG_LAUNCH, type: "compliance", title: "Compliance item overdue", body: "Insurance certificate for Samsung Galaxy Launch is still outstanding.", is_read: false, link: "/events/" + EVT_SAMSUNG_LAUNCH, created_at: "2026-06-15T08:00:00Z", kind: "compliance_overdue", priority: "high", entity_type: "event", entity_id: EVT_SAMSUNG_LAUNCH, action_required: true },
    { id: "ad000000-0000-4000-8000-000000000005", user_id: P_SARAH, event_id: EVT_COKE_SUMMER, type: "message", title: "New message from James Chen", body: "Question about the final artwork deadline.", is_read: true, link: "/events/" + EVT_COKE_SUMMER, created_at: "2026-06-12T09:11:00Z", kind: "message_received", priority: "normal", entity_type: "event", entity_id: EVT_COKE_SUMMER, action_required: false },
    { id: "ad000000-0000-4000-8000-000000000006", user_id: P_JAMES, event_id: EVT_COKE_SUMMER, type: "task", title: "Action needed: confirm prize details", body: "Confirm prize details and quantities to keep your Summer Festival on track.", is_read: false, link: "/events/" + EVT_COKE_SUMMER, created_at: "2026-06-16T07:00:00Z", kind: "task_assigned", priority: "high", entity_type: "event", entity_id: EVT_COKE_SUMMER, action_required: true },
    { id: "ad000000-0000-4000-8000-000000000007", user_id: P_JAMES, event_id: EVT_COKE_SUMMER, type: "approval", title: "Creative ready to approve", body: "Your Idle Screen Advert proof is ready for sign-off.", is_read: true, link: "/events/" + EVT_COKE_SUMMER + "/approvals", created_at: "2026-06-13T15:00:00Z", kind: "approval_requested", priority: "normal", entity_type: "event", entity_id: EVT_COKE_SUMMER, action_required: false },
    { id: "ad000000-0000-4000-8000-000000000008", user_id: P_TOM, event_id: EVT_COKE_SUMMER, type: "logistics", title: "Logistics ready to schedule", body: "Wrap sign-off pending — run sheet can be finalised once approved.", is_read: false, link: "/events/" + EVT_COKE_SUMMER, created_at: "2026-06-17T11:05:00Z", kind: "logistics_update", priority: "normal", entity_type: "event", entity_id: EVT_COKE_SUMMER, action_required: false },
  ],

  recommendations: [
    { id: "ae000000-0000-4000-8000-000000000001", category: "machine_game_combo", context_json: { eventType: "sampling" }, recommendation_json: { machine: "Bright.Vend Pro", game: "Spin & Reveal", reason: "Highest sample throughput for tier-1 sampling events." }, confidence_score: 0.86, sample_size: 22, updated_at: "2026-06-10T09:00:00Z" },
    { id: "ae000000-0000-4000-8000-000000000002", category: "machine_game_combo", context_json: { eventType: "activation" }, recommendation_json: { machine: "Bright.Play", game: "Photo Booth Pro", reason: "Top dwell time and share rate across recent activations." }, confidence_score: 0.81, sample_size: 28, updated_at: "2026-06-10T09:00:00Z" },
    { id: "ae000000-0000-4000-8000-000000000003", category: "package_for_objective", context_json: { eventType: "activation", objective: "lead_capture" }, recommendation_json: { package: "Bright.Play — Five-Day Activation", reason: "Best lead-per-day conversion when the goal is data capture." }, confidence_score: 0.79, sample_size: 19, updated_at: "2026-06-10T09:00:00Z" },
    { id: "ae000000-0000-4000-8000-000000000004", category: "location_performance", context_json: { eventType: "sampling", tier: "tier_1" }, recommendation_json: { insight: "Tier-1 transport hubs outperform shopping centres by ~31% on samples/day." }, confidence_score: 0.83, sample_size: 24, updated_at: "2026-06-10T09:00:00Z" },
  ],

  event_team_members: [
    { id: "af000000-0000-4000-8000-000000000001", event_id: EVT_COKE_SUMMER, profile_id: P_JAMES, email: "james.chen@cocacola.com", role_label: "Brand Lead", status: "approved", requested_by: P_JAMES, approved_by: P_SARAH, created_at: "2026-06-11T09:00:00Z", updated_at: "2026-06-11T10:00:00Z" },
    { id: "af000000-0000-4000-8000-000000000002", event_id: EVT_COKE_SUMMER, profile_id: null, email: "amelia.ford@cocacola.com", role_label: "Marketing Manager", status: "pending", requested_by: P_JAMES, approved_by: null, created_at: "2026-06-16T14:20:00Z", updated_at: "2026-06-16T14:20:00Z" },
    { id: "af000000-0000-4000-8000-000000000003", event_id: EVT_COKE_SUMMER, profile_id: null, email: "design@cocacola.com", role_label: "Brand Design", status: "approved", requested_by: P_JAMES, approved_by: P_SARAH, created_at: "2026-06-12T11:00:00Z", updated_at: "2026-06-12T12:00:00Z" },
    { id: "af000000-0000-4000-8000-000000000004", event_id: EVT_SAMSUNG_LAUNCH, profile_id: null, email: "aisha@samsung.example", role_label: "Brand Lead", status: "approved", requested_by: P_SARAH, approved_by: P_SARAH, created_at: "2026-05-28T09:00:00Z", updated_at: "2026-05-28T09:00:00Z" },
    { id: "af000000-0000-4000-8000-000000000005", event_id: EVT_SAMSUNG_LAUNCH, profile_id: null, email: "events@samsung.example", role_label: "Events Coordinator", status: "pending", requested_by: P_SARAH, approved_by: null, created_at: "2026-06-09T09:00:00Z", updated_at: "2026-06-09T09:00:00Z" },
  ],

  campaigns: [
    { id: CMP_COKE, account_id: ACC_COKE, name: "Coca-Cola 2026 Experiential Tour", description: "Year-long sampling and activation programme across UK festivals and markets.", status: "active", start_date: "2026-03-01", end_date: "2026-12-31", shared_creative_json: { theme: "Real Magic Summer", palette: ["#F40009", "#FFFFFF"] }, aggregate_metrics_json: { totalPlays: 13390, totalLeads: 4214, totalPrizes: 2891, events: 3 }, created_at: "2026-02-20T10:00:00Z", updated_at: "2026-06-18T09:00:00Z" },
    { id: CMP_SAMSUNG, account_id: ACC_SAMSUNG, name: "Galaxy Launch Series", description: "Product-launch activations tied to the 2026 Galaxy release cadence.", status: "active", start_date: "2026-04-01", end_date: "2026-08-31", shared_creative_json: { theme: "Unfold the Moment" }, aggregate_metrics_json: { totalPlays: 18000, totalLeads: 6200, events: 2 }, created_at: "2026-03-10T10:00:00Z", updated_at: "2026-06-18T09:00:00Z" },
  ],

  campaign_events: [
    { id: "cb000000-0000-4000-8000-000000000001", campaign_id: CMP_COKE, event_id: EVT_COKE_SUMMER, sort_order: 0, created_at: "2026-03-01T10:00:00Z" },
    { id: "cb000000-0000-4000-8000-000000000002", campaign_id: CMP_COKE, event_id: EVT_COKE_XMAS, sort_order: 1, created_at: "2026-04-01T10:00:00Z" },
    { id: "cb000000-0000-4000-8000-000000000003", campaign_id: CMP_COKE, event_id: EVT_COKE_SPRING, sort_order: 2, created_at: "2026-03-01T10:00:00Z" },
    { id: "cb000000-0000-4000-8000-000000000004", campaign_id: CMP_SAMSUNG, event_id: EVT_SAMSUNG_LAUNCH, sort_order: 0, created_at: "2026-04-01T10:00:00Z" },
    { id: "cb000000-0000-4000-8000-000000000005", campaign_id: CMP_SAMSUNG, event_id: EVT_SAMSUNG_UNPACKED, sort_order: 1, created_at: "2026-04-01T10:00:00Z" },
  ],

  invoices: [
    { id: "ac000000-0000-4000-8000-000000000001", event_id: EVT_COKE_SPRING, account_id: ACC_COKE, invoice_number: "INV-2026-0012", amount: 28500.0, currency: "GBP", payment_method: "invoice", po_number: null, issued_at: "2026-03-25T09:00:00Z", due_at: "2026-04-24T09:00:00Z", paid_at: "2026-04-10T14:30:00Z", payment_reference: "BACS-CC-88213", status: "paid", notes: "Spring Sampling Tour — final invoice.", created_by: P_SARAH, created_at: "2026-03-25T09:00:00Z", updated_at: "2026-04-10T14:30:00Z" },
    { id: "ac000000-0000-4000-8000-000000000002", event_id: EVT_SAMSUNG_LAUNCH, account_id: ACC_SAMSUNG, invoice_number: "INV-2026-0021", amount: 41250.0, currency: "GBP", payment_method: "po", po_number: "PO-SMSNG-8841", issued_at: "2026-06-05T09:00:00Z", due_at: "2026-07-05T09:00:00Z", paid_at: null, payment_reference: null, status: "issued", notes: "Galaxy Launch — deposit invoice against PO.", created_by: P_SARAH, created_at: "2026-06-05T09:00:00Z", updated_at: "2026-06-05T09:00:00Z" },
    { id: "ac000000-0000-4000-8000-000000000003", event_id: EVT_SAMSUNG_UNPACKED, account_id: ACC_SAMSUNG, invoice_number: "INV-2026-0019", amount: 27500.0, currency: "GBP", payment_method: "invoice", po_number: null, issued_at: "2026-04-15T09:00:00Z", due_at: "2026-05-15T09:00:00Z", paid_at: null, payment_reference: null, status: "overdue", notes: "Unpacked Pop-Up — final invoice, payment chased.", created_by: P_SARAH, created_at: "2026-04-15T09:00:00Z", updated_at: "2026-05-16T09:00:00Z" },
    { id: "ac000000-0000-4000-8000-000000000004", event_id: EVT_COKE_SUMMER, account_id: ACC_COKE, invoice_number: "INV-2026-0024", amount: 95000.0, currency: "GBP", payment_method: "deposit_plus_invoice", po_number: null, issued_at: null, due_at: null, paid_at: null, payment_reference: null, status: "draft", notes: "Summer Festival — draft pending final scope.", created_by: P_SARAH, created_at: "2026-06-10T09:00:00Z", updated_at: "2026-06-10T09:00:00Z" },
  ],

  // Category-average benchmarks keyed to match the report chart's metric keys
  // (interactions / leads / impressions). Each average sits comfortably below
  // the seeded event totals, so "Your Event" clearly beats "Category Average".
  benchmarks: [
    { event_type: "sampling", location_tier: "tier_1", machine_type: "Bright.Vend Pro", metric_name: "interactions", avg_value: 6500, median_value: 6300, p25_value: 5200, p75_value: 7400, sample_size: 24 },
    { event_type: "sampling", location_tier: "tier_1", machine_type: "Bright.Vend Pro", metric_name: "leads", avg_value: 1560, median_value: 1510, p25_value: 1240, p75_value: 1820, sample_size: 24 },
    { event_type: "sampling", location_tier: "tier_1", machine_type: "Bright.Vend Pro", metric_name: "impressions", avg_value: 332000, median_value: 318000, p25_value: 264000, p75_value: 392000, sample_size: 24 },
    { event_type: "activation", location_tier: "tier_1", machine_type: "Bright.Play", metric_name: "interactions", avg_value: 5600, median_value: 5400, p25_value: 4500, p75_value: 6500, sample_size: 31 },
    { event_type: "activation", location_tier: "tier_1", machine_type: "Bright.Play", metric_name: "leads", avg_value: 1420, median_value: 1380, p25_value: 1120, p75_value: 1680, sample_size: 31 },
    { event_type: "activation", location_tier: "tier_1", machine_type: "Bright.Play", metric_name: "impressions", avg_value: 285000, median_value: 272000, p25_value: 228000, p75_value: 338000, sample_size: 31 },
  ],
};
