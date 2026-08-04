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
const EVT_COKE_CARNIVAL = "e4444444-4444-4444-4444-444444444444";
const EVT_SAMSUNG_UNPACKED = "e5555555-5555-5555-5555-555555555555";
const EVT_COKE_SPRING = "e6666666-6666-6666-6666-666666666666";

const PARTNER_NORTH = "e0e0e0e0-e0e0-4e0e-8e0e-e0e0e0e0e0e0";
const PARTNER_EXCEL = "e1e1e1e1-e1e1-4e1e-8e1e-e1e1e1e1e1e1";
const PARTNER_SOUTHERN = "e2e2e2e2-e2e2-4e2e-8e2e-e2e2e2e2e2e2";
const PARTNER_WESTFIELD = "e3e3e3e3-e3e3-4e3e-8e3e-e3e3e3e3e3e3";
const PARTNER_NEC = "e4e4e4e4-e4e4-4e4e-8e4e-e4e4e4e4e4e4";
const VENUE_MANCHESTER = "f0f0f0f0-f0f0-4f0f-8f0f-f0f0f0f0f0f0";
const VENUE_EXCEL = "f1f1f1f1-f1f1-4f1f-8f1f-f1f1f1f1f1f1";
const VENUE_WESTFIELD = "f2f2f2f2-f2f2-4f2f-8f2f-f2f2f2f2f2f2";
const VENUE_NEC = "f3f3f3f3-f3f3-4f3f-8f3f-f3f3f3f3f3f3";

const MI_PRO1 = "1a1a1a1a-1a1a-4a1a-8a1a-1a1a1a1a1a1a";
const MI_PRO2 = "1b1b1b1b-1b1b-4b1b-8b1b-1b1b1b1b1b1b";

// ExCeL London concourse units + the advertisers/show organisers who book them.
const MI_EXCEL = (n: number) => `ec000000-0000-4000-8000-0000000000${String(n).padStart(2, "0")}`;
const PL_EXCEL = (n: number) => `b1000000-0000-4000-8000-0000000000${String(10 + n).padStart(2, "0")}`;
const ACC_DIAGEO = "cccccccc-cccc-cccc-cccc-cccccccccccc";
const ACC_TECHSHOW = "ad000000-0000-4000-8000-000000000001";
const ACC_VITALITY = "ad000000-0000-4000-8000-000000000002";
const ACC_MONSTER = "ad000000-0000-4000-8000-000000000003";
const ACC_EE = "ad000000-0000-4000-8000-000000000004";
const ACC_DAZN = "ad000000-0000-4000-8000-000000000005";
const ACC_COMICCON = "ad000000-0000-4000-8000-000000000006";

const PKG_VEND_DAY = "c1c1c1c1-c1c1-4c1c-8c1c-c1c1c1c1c1c1";
const PKG_VEND_WEEKEND = "c2c2c2c2-c2c2-4c2c-8c2c-c2c2c2c2c2c2";
const PKG_PLAY_5DAY = "c3c3c3c3-c3c3-4c3c-8c3c-c3c3c3c3c3c3";

const ASSET_WRAP = "a1f00000-0000-4000-8000-000000000003"; // Machine Wrap Artwork
const ASSET_BANNER = "a1f00000-0000-4000-8000-000000000009"; // Game Page Banner

// ── Organizer demo: one show producer running a multi-machine conference ───
// Informa-style: several units at one show doing different jobs, sponsor
// inventory sold against them, and no access to the leads those units capture.
const PARTNER_INFORMA = "e5e5e5e5-e5e5-4e5e-8e5e-e5e5e5e5e5e5";
const P_NADIA = "b5b5b5b5-b5b5-4b5b-8b5b-b5b5b5b5b5b5"; // Informa Tech shows admin
const ACC_INFORMA = "ad000000-0000-4000-8000-000000000007";
const EVT_TECH_LIVE = "e7777777-7777-7777-7777-777777777777";
// A second edition, still being set up, so the portfolio and fleet views have
// more than one show in them and the "needs setting up" path is real.
const EVT_TECH_NORTH = "e7777777-7777-7777-7777-777777777778";
const MI_SHOW = (n: number) =>
  `e7000000-0000-4000-8000-0000000000${String(n).padStart(2, "0")}`;
const SLOT_SHOW = (n: number) =>
  `b2000000-0000-4000-8000-0000000002${String(n).padStart(2, "0")}`;
const ASSET_SHOW_WRAP = "a7000000-0000-4000-8000-000000000001";
const ASSET_SHOW_SCREEN = "a7000000-0000-4000-8000-000000000002";
const ASSET_NORTH_WRAP = "a7000000-0000-4000-8000-000000000003";
const ASSET_NORTH_SCREEN = "a7000000-0000-4000-8000-000000000004";

// Partner-portal personas (added so you can log in as a partner/venue contact).
const P_MAYA = "66666666-6666-6666-6666-666666666666"; // Northern Events admin
const P_AARON = "77777777-7777-7777-7777-777777777777"; // ExCeL London venue admin
const P_OLIVIA = "88888888-8888-8888-8888-888888888888"; // Southern Brand Activations admin
const P_DANIEL = "99999999-9999-9999-9999-999999999999"; // Westfield Stratford admin
const P_PRIYA = "a8a8a8a8-a8a8-4a8a-8a8a-a8a8a8a8a8a8"; // NEC Birmingham admin

// Stable IDs for cross-referenced rows.
const PL_MANCHESTER_SUMMER = "b1000000-0000-4000-8000-000000000001";
const PL_MANCHESTER_SPRING = "b1000000-0000-4000-8000-000000000003";
const PL_WESTFIELD_SUMMER = "b1000000-0000-4000-8000-000000000004";
const PL_NEC_AUTUMN = "b1000000-0000-4000-8000-000000000005";
const CMP_COKE = "ca000000-0000-4000-8000-000000000001";
const CMP_SAMSUNG = "ca000000-0000-4000-8000-000000000002";
const CMT_BANNER = "cc000000-0000-4000-8000-000000000001";

export const EXTRA_TABLES: Record<string, MockRow[]> = {
  // Delivery blueprints — mirrors supabase/migrations/...seed_templates.sql so
  // auto-provisioning from an accepted quote lands a full runway (milestones,
  // tasks, assets, QA) in the standalone demo, not an empty event.
  event_templates: [
    {
      id: "00000000-0000-4000-8000-000000000101",
      name: "Standard Activation",
      description: "Turnkey single-day activation with one machine and standard game.",
      event_type: "activation",
      package_type: "standard",
      is_active: true,
      milestones_json: [
        { name: "Event Confirmed", stage: "confirmed", status: "pending", sort_order: 0, customer_visible: true },
        { name: "Briefing Complete", stage: "kickoff_complete", status: "pending", sort_order: 1, customer_visible: true },
        { name: "Assets Approved", stage: "creative_assets", status: "pending", sort_order: 2, customer_visible: true },
        { name: "Logistics Confirmed", stage: "logistics_confirmed", status: "pending", sort_order: 3, customer_visible: true },
        { name: "Go Live", stage: "event_live", status: "pending", sort_order: 4, customer_visible: true },
        { name: "Report Published", stage: "reporting", status: "pending", sort_order: 5, customer_visible: true },
      ],
      tasks_json: [
        { title: "Complete event briefing", task_type: "customer_action", category: "admin", status: "pending", priority: "high", is_blocking: true, customer_visible: true, sort_order: 0, assigned_role: "events_lead", target_path: "briefing" },
        { title: "Upload brand guidelines", task_type: "customer_action", category: "creative", status: "pending", priority: "high", is_blocking: true, customer_visible: true, sort_order: 1, assigned_role: "creative_lead", target_path: "assets" },
        { title: "Upload hero image", task_type: "customer_action", category: "creative", status: "pending", priority: "medium", is_blocking: false, customer_visible: true, sort_order: 2, assigned_role: "creative_lead", target_path: "assets" },
        { title: "Approve game mechanics", task_type: "customer_action", category: "creative", status: "pending", priority: "high", is_blocking: true, customer_visible: true, sort_order: 3, assigned_role: "events_lead", target_path: "approvals" },
        { title: "Confirm delivery logistics", task_type: "internal_action", category: "logistics", status: "pending", priority: "high", is_blocking: true, customer_visible: false, sort_order: 4, assigned_role: "operations_lead", target_path: "logistics" },
        { title: "Run QA checklist", task_type: "internal_action", category: "qa", status: "pending", priority: "high", is_blocking: true, customer_visible: false, sort_order: 5, assigned_role: "qa_lead", target_path: "qa" },
        { title: "Generate post-event report", task_type: "internal_action", category: "reporting", status: "pending", priority: "medium", is_blocking: false, customer_visible: false, sort_order: 6, assigned_role: "events_lead", target_path: "reports" },
      ],
      assets_json: [
        { name: "Brand guidelines", asset_type: "document", required_format: "PDF", status: "required", customer_visible: true, version: 1, review_status: "pending_review", revision_count: 0 },
        { name: "Hero image", asset_type: "image", required_format: "PNG/JPG", required_dimensions: "1920x1080", status: "required", customer_visible: true, version: 1, review_status: "pending_review", revision_count: 0 },
        { name: "Game screen design", asset_type: "image", required_format: "PNG", required_dimensions: "1080x1920", status: "required", customer_visible: true, version: 1, review_status: "pending_review", revision_count: 0 },
      ],
      qa_items_json: [
        { category: "machine", title: "Machine powers on and boots correctly", status: "pending", sort_order: 0 },
        { category: "game_logic", title: "Game loads with correct branding", status: "pending", sort_order: 1 },
        { category: "game_logic", title: "Prize mechanic triggers at configured rate", status: "pending", sort_order: 2 },
        { category: "ux_ui", title: "Attract screen displays correct creative", status: "pending", sort_order: 3 },
        { category: "webform", title: "Lead capture form submits successfully", status: "pending", sort_order: 4 },
        { category: "webform", title: "GDPR consent checkbox present and functional", status: "pending", sort_order: 5 },
      ],
      compliance_json: [],
      game_config_defaults_json: null,
      product_config_defaults_json: null,
      venue_requirements_json: [],
    },
    {
      id: "00000000-0000-4000-8000-000000000102",
      name: "Premium Activation",
      description: "Multi-day premium activation with custom game build and on-site support.",
      event_type: "activation",
      package_type: "premium",
      is_active: true,
      milestones_json: [
        { name: "Event Confirmed", stage: "confirmed", status: "pending", sort_order: 0, customer_visible: true },
        { name: "Briefing Complete", stage: "kickoff_complete", status: "pending", sort_order: 1, customer_visible: true },
        { name: "Assets Approved", stage: "creative_assets", status: "pending", sort_order: 2, customer_visible: true },
        { name: "Build Signed Off", stage: "approvals", status: "pending", sort_order: 3, customer_visible: true },
        { name: "Logistics Confirmed", stage: "logistics_confirmed", status: "pending", sort_order: 4, customer_visible: true },
        { name: "Go Live", stage: "event_live", status: "pending", sort_order: 5, customer_visible: true },
        { name: "Report Published", stage: "reporting", status: "pending", sort_order: 6, customer_visible: true },
      ],
      tasks_json: [
        { title: "Complete event briefing", task_type: "customer_action", category: "admin", status: "pending", priority: "high", is_blocking: true, customer_visible: true, sort_order: 0, assigned_role: "events_lead", target_path: "briefing" },
        { title: "Upload brand guidelines", task_type: "customer_action", category: "creative", status: "pending", priority: "high", is_blocking: true, customer_visible: true, sort_order: 1, assigned_role: "creative_lead", target_path: "assets" },
        { title: "Upload hero image", task_type: "customer_action", category: "creative", status: "pending", priority: "high", is_blocking: true, customer_visible: true, sort_order: 2, assigned_role: "creative_lead", target_path: "assets" },
        { title: "Upload game screen designs", task_type: "customer_action", category: "creative", status: "pending", priority: "high", is_blocking: true, customer_visible: true, sort_order: 3, assigned_role: "creative_lead", target_path: "studio" },
        { title: "Upload video assets", task_type: "customer_action", category: "creative", status: "pending", priority: "medium", is_blocking: false, customer_visible: true, sort_order: 4, assigned_role: "creative_lead", target_path: "assets" },
        { title: "Approve game mechanics", task_type: "customer_action", category: "creative", status: "pending", priority: "high", is_blocking: true, customer_visible: true, sort_order: 5, assigned_role: "events_lead", target_path: "approvals" },
        { title: "Review and approve build proof", task_type: "customer_action", category: "creative", status: "pending", priority: "high", is_blocking: true, customer_visible: true, sort_order: 6, assigned_role: "events_lead", target_path: "approvals" },
        { title: "Confirm delivery logistics", task_type: "internal_action", category: "logistics", status: "pending", priority: "high", is_blocking: true, customer_visible: false, sort_order: 7, assigned_role: "operations_lead", target_path: "logistics" },
        { title: "Arrange on-site technician", task_type: "internal_action", category: "operations", status: "pending", priority: "high", is_blocking: true, customer_visible: false, sort_order: 8, assigned_role: "operations_lead", target_path: "logistics" },
        { title: "Run QA checklist", task_type: "internal_action", category: "qa", status: "pending", priority: "high", is_blocking: true, customer_visible: false, sort_order: 9, assigned_role: "qa_lead", target_path: "qa" },
        { title: "Generate post-event report", task_type: "internal_action", category: "reporting", status: "pending", priority: "medium", is_blocking: false, customer_visible: false, sort_order: 10, assigned_role: "events_lead", target_path: "reports" },
      ],
      assets_json: [
        { name: "Brand guidelines", asset_type: "document", required_format: "PDF", status: "required", customer_visible: true, version: 1, review_status: "pending_review", revision_count: 0 },
        { name: "Hero image", asset_type: "image", required_format: "PNG/JPG", required_dimensions: "1920x1080", status: "required", customer_visible: true, version: 1, review_status: "pending_review", revision_count: 0 },
        { name: "Game screen designs", asset_type: "image", required_format: "PSD/AI", status: "required", customer_visible: true, version: 1, review_status: "pending_review", revision_count: 0 },
        { name: "Video loop (attract screen)", asset_type: "video", required_format: "MP4", required_dimensions: "1080x1920", status: "required", customer_visible: true, version: 1, review_status: "pending_review", revision_count: 0 },
        { name: "Prize creative", asset_type: "image", required_format: "PNG", required_dimensions: "800x600", status: "required", customer_visible: true, version: 1, review_status: "pending_review", revision_count: 0 },
      ],
      qa_items_json: [
        { category: "machine", title: "Machine powers on and boots correctly", status: "pending", sort_order: 0 },
        { category: "machine", title: "Touchscreen calibration verified", status: "pending", sort_order: 1 },
        { category: "game_logic", title: "Game loads with correct branding", status: "pending", sort_order: 2 },
        { category: "game_logic", title: "All game levels / stages playable", status: "pending", sort_order: 3 },
        { category: "game_logic", title: "Prize mechanic triggers at configured rate", status: "pending", sort_order: 4 },
        { category: "ux_ui", title: "Attract screen displays correct creative", status: "pending", sort_order: 5 },
        { category: "ux_ui", title: "End screen shows share / CTA correctly", status: "pending", sort_order: 6 },
        { category: "webform", title: "Lead capture form submits successfully", status: "pending", sort_order: 7 },
        { category: "webform", title: "GDPR consent checkbox present and functional", status: "pending", sort_order: 8 },
        { category: "wrap", title: "Machine wrap matches approved artwork", status: "pending", sort_order: 9 },
      ],
      compliance_json: [],
      game_config_defaults_json: null,
      product_config_defaults_json: null,
      venue_requirements_json: [],
    },
    {
      id: "00000000-0000-4000-8000-000000000103",
      name: "Sampling Campaign",
      description: "Product sampling via vending machine with branded game and lead capture.",
      event_type: "sampling",
      package_type: "standard",
      is_active: true,
      milestones_json: [
        { name: "Event Confirmed", stage: "confirmed", status: "pending", sort_order: 0, customer_visible: true },
        { name: "Briefing Complete", stage: "kickoff_complete", status: "pending", sort_order: 1, customer_visible: true },
        { name: "Assets Approved", stage: "creative_assets", status: "pending", sort_order: 2, customer_visible: true },
        { name: "Product Loaded", stage: "build_configuration", status: "pending", sort_order: 3, customer_visible: true },
        { name: "Logistics Confirmed", stage: "logistics_confirmed", status: "pending", sort_order: 4, customer_visible: true },
        { name: "Go Live", stage: "event_live", status: "pending", sort_order: 5, customer_visible: true },
        { name: "Report Published", stage: "reporting", status: "pending", sort_order: 6, customer_visible: true },
      ],
      tasks_json: [
        { title: "Complete event briefing", task_type: "customer_action", category: "admin", status: "pending", priority: "high", is_blocking: true, customer_visible: true, sort_order: 0, assigned_role: "events_lead", target_path: "briefing" },
        { title: "Upload brand guidelines", task_type: "customer_action", category: "creative", status: "pending", priority: "high", is_blocking: true, customer_visible: true, sort_order: 1, assigned_role: "creative_lead", target_path: "assets" },
        { title: "Upload hero image", task_type: "customer_action", category: "creative", status: "pending", priority: "medium", is_blocking: false, customer_visible: true, sort_order: 2, assigned_role: "creative_lead", target_path: "assets" },
        { title: "Provide product samples specifications", task_type: "customer_action", category: "operations", status: "pending", priority: "high", is_blocking: true, customer_visible: true, sort_order: 3, assigned_role: "operations_lead", target_path: "logistics" },
        { title: "Ship product samples to warehouse", task_type: "customer_action", category: "logistics", status: "pending", priority: "high", is_blocking: true, customer_visible: true, sort_order: 4, assigned_role: "operations_lead", target_path: "logistics" },
        { title: "Approve game mechanics", task_type: "customer_action", category: "creative", status: "pending", priority: "high", is_blocking: true, customer_visible: true, sort_order: 5, assigned_role: "events_lead", target_path: "approvals" },
        { title: "Load product into machine", task_type: "internal_action", category: "operations", status: "pending", priority: "high", is_blocking: true, customer_visible: false, sort_order: 6, assigned_role: "operations_lead", target_path: "logistics" },
        { title: "Confirm delivery logistics", task_type: "internal_action", category: "logistics", status: "pending", priority: "high", is_blocking: true, customer_visible: false, sort_order: 7, assigned_role: "operations_lead", target_path: "logistics" },
        { title: "Run QA checklist", task_type: "internal_action", category: "qa", status: "pending", priority: "high", is_blocking: true, customer_visible: false, sort_order: 8, assigned_role: "qa_lead", target_path: "qa" },
        { title: "Generate post-event report", task_type: "internal_action", category: "reporting", status: "pending", priority: "medium", is_blocking: false, customer_visible: false, sort_order: 9, assigned_role: "events_lead", target_path: "reports" },
      ],
      assets_json: [
        { name: "Brand guidelines", asset_type: "document", required_format: "PDF", status: "required", customer_visible: true, version: 1, review_status: "pending_review", revision_count: 0 },
        { name: "Hero image", asset_type: "image", required_format: "PNG/JPG", required_dimensions: "1920x1080", status: "required", customer_visible: true, version: 1, review_status: "pending_review", revision_count: 0 },
        { name: "Game screen design", asset_type: "image", required_format: "PNG", required_dimensions: "1080x1920", status: "required", customer_visible: true, version: 1, review_status: "pending_review", revision_count: 0 },
        { name: "Product sample photo", asset_type: "image", required_format: "PNG/JPG", status: "required", customer_visible: true, version: 1, review_status: "pending_review", revision_count: 0 },
      ],
      qa_items_json: [
        { category: "machine", title: "Machine powers on and boots correctly", status: "pending", sort_order: 0 },
        { category: "machine", title: "Vend mechanism dispenses correctly", status: "pending", sort_order: 1 },
        { category: "product", title: "Product fits vend slot dimensions", status: "pending", sort_order: 2 },
        { category: "product", title: "Product temperature requirements met", status: "pending", sort_order: 3 },
        { category: "game_logic", title: "Game loads with correct branding", status: "pending", sort_order: 4 },
        { category: "game_logic", title: "Win triggers vend correctly", status: "pending", sort_order: 5 },
        { category: "ux_ui", title: "Attract screen displays correct creative", status: "pending", sort_order: 6 },
        { category: "webform", title: "Lead capture form submits successfully", status: "pending", sort_order: 7 },
        { category: "webform", title: "GDPR consent checkbox present and functional", status: "pending", sort_order: 8 },
      ],
      compliance_json: [],
      game_config_defaults_json: null,
      product_config_defaults_json: null,
      venue_requirements_json: [],
    },
  ],

  // Appended to the existing profiles so partner-portal logins resolve.
  // has_completed_onboarding must be true, or the home redirect sends partners
  // to the customer /welcome wizard before the partner/venue portal redirect.
  profiles: [
    { id: P_MAYA, name: "Maya Patel", email: "maya@northern.events", role: "partner_admin", account_id: null, has_completed_onboarding: true },
    { id: P_AARON, name: "Aaron Howe", email: "aaron@excel.london", role: "partner_admin", account_id: null, has_completed_onboarding: true },
    { id: P_OLIVIA, name: "Olivia Reed", email: "olivia@southern-activations.com", role: "partner_admin", account_id: null, has_completed_onboarding: true },
    { id: P_DANIEL, name: "Daniel Cole", email: "daniel@westfield-stratford.com", role: "partner_admin", account_id: null, has_completed_onboarding: true },
    { id: P_PRIYA, name: "Priya Shah", email: "priya@necgroup.co.uk", role: "partner_admin", account_id: null, has_completed_onboarding: true },
    { id: P_NADIA, name: "Nadia Okafor", email: "nadia@informatech.events", role: "partner_admin", account_id: null, has_completed_onboarding: true },
  ],

  partner_users: [
    { id: "d0000000-0000-4000-8000-000000000001", partner_id: PARTNER_NORTH, profile_id: P_MAYA, role: "admin", created_at: "2026-01-10T10:05:00Z" },
    { id: "d0000000-0000-4000-8000-000000000002", partner_id: PARTNER_EXCEL, profile_id: P_AARON, role: "admin", created_at: "2026-02-04T10:05:00Z" },
    { id: "d0000000-0000-4000-8000-000000000003", partner_id: PARTNER_SOUTHERN, profile_id: P_OLIVIA, role: "admin", created_at: "2026-02-18T10:05:00Z" },
    { id: "d0000000-0000-4000-8000-000000000004", partner_id: PARTNER_WESTFIELD, profile_id: P_DANIEL, role: "admin", created_at: "2026-03-02T10:05:00Z" },
    { id: "d0000000-0000-4000-8000-000000000005", partner_id: PARTNER_NEC, profile_id: P_PRIYA, role: "admin", created_at: "2026-03-12T10:05:00Z" },
    { id: "d0000000-0000-4000-8000-000000000006", partner_id: PARTNER_INFORMA, profile_id: P_NADIA, role: "admin", created_at: "2026-04-08T10:05:00Z" },
  ],

  // The show producer themselves, plus the delivery account their show runs
  // under. `type: "organizer"` is what routes Nadia to /organizers/:slug.
  partners: [
    { id: PARTNER_INFORMA, name: "Informa Tech Shows", slug: "informa-tech-shows", type: "organizer", contact_name: "Nadia Okafor", contact_email: "nadia@informatech.events", brand_color: "#1E47F0", partner_code: "BB-INFRM001", status: "active", onboarded_at: "2026-04-08T10:00:00Z" },
  ],

  accounts: [
    { id: ACC_INFORMA, name: "Informa Tech Shows", slug: "informa-tech-shows" },
  ],

  // A live three-day conference with five units doing four different jobs.
  events: [
    {
      id: EVT_TECH_LIVE,
      account_id: ACC_INFORMA,
      organizer_partner_id: PARTNER_INFORMA,
      name: "Tech Live London 2026",
      event_type: "activation",
      package_type: "custom",
      machine_type: "Bright.Play",
      venue_name: "ExCeL London",
      venue_address: "One Western Gateway, Royal Victoria Dock, London E16 1XL",
      event_date_start: "2026-06-17",
      event_date_end: "2026-06-19",
      setup_date: "2026-06-16",
      collection_date: "2026-06-20",
      current_stage: "event_live",
      health_status: "green",
      created_by: P_SARAH,
      created_at: "2026-04-10T10:00:00Z",
    },
    {
      id: EVT_TECH_NORTH,
      account_id: ACC_INFORMA,
      organizer_partner_id: PARTNER_INFORMA,
      name: "Tech Live North 2026",
      event_type: "activation",
      package_type: "custom",
      machine_type: "Bright.Play",
      venue_name: "Manchester Central",
      venue_address: "Petersfield, Manchester M2 3GX",
      event_date_start: "2026-11-04",
      event_date_end: "2026-11-05",
      setup_date: "2026-11-03",
      collection_date: "2026-11-06",
      current_stage: "confirmed",
      health_status: "green",
      created_by: P_SARAH,
      created_at: "2026-06-20T10:00:00Z",
    },
  ],

  // Five units, each with the zone the organizer named and the job it's there
  // to do. BV-SHOW04 is deliberately stale so the fleet board's "needs
  // attention" path has something real to show.
  machine_instances: [
    { id: MI_SHOW(1), machine_type_id: "a3a3a3a3-a3a3-4a3a-8a3a-a3a3a3a3a3a3", serial_number: "BV-SHOW01", nickname: "Registration North", current_event_id: EVT_TECH_LIVE, zone: "Registration", mission: "welcome_gift", status: "deployed", last_heartbeat: "2026-06-18T13:58:00Z", firmware_version: "3.1.0" },
    { id: MI_SHOW(2), machine_type_id: "a3a3a3a3-a3a3-4a3a-8a3a-a3a3a3a3a3a3", serial_number: "BV-SHOW02", nickname: "Registration South", current_event_id: EVT_TECH_LIVE, zone: "Registration", mission: "welcome_gift", status: "deployed", last_heartbeat: "2026-06-18T13:59:00Z", firmware_version: "3.1.0" },
    { id: MI_SHOW(3), machine_type_id: "a3a3a3a3-a3a3-4a3a-8a3a-a3a3a3a3a3a3", serial_number: "BV-SHOW03", nickname: "Hall 3 Sponsor Stand", current_event_id: EVT_TECH_LIVE, zone: "Hall 3", mission: "sponsor_activation", status: "deployed", last_heartbeat: "2026-06-18T13:57:00Z", firmware_version: "3.1.0" },
    { id: MI_SHOW(4), machine_type_id: "a3a3a3a3-a3a3-4a3a-8a3a-a3a3a3a3a3a3", serial_number: "BV-SHOW04", nickname: "Hall 5 Sponsor Stand", current_event_id: EVT_TECH_LIVE, zone: "Hall 5", mission: "sponsor_activation", status: "deployed", last_heartbeat: "2026-06-18T09:12:00Z", firmware_version: "3.1.0" },
    { id: MI_SHOW(5), machine_type_id: "a2a2a2a2-a2a2-4a2a-8a2a-a2a2a2a2a2a2", serial_number: "BV-SHOW05", nickname: "Rebooking Desk", current_event_id: EVT_TECH_LIVE, zone: "Rebooking desk", mission: "rebook_reward", status: "deployed", last_heartbeat: "2026-06-18T13:56:00Z", firmware_version: "2.3.1" },
    // The November edition: allocated but not yet placed. One unit has a zone
    // and no job, the other has neither — the state the deployment form exists
    // to clear.
    { id: MI_SHOW(6), machine_type_id: "a3a3a3a3-a3a3-4a3a-8a3a-a3a3a3a3a3a3", serial_number: "BV-SHOW06", nickname: "Manchester unit 1", current_event_id: EVT_TECH_NORTH, zone: "Registration", mission: null, status: "deployed", last_heartbeat: null, firmware_version: "3.1.0" },
    { id: MI_SHOW(7), machine_type_id: "a3a3a3a3-a3a3-4a3a-8a3a-a3a3a3a3a3a3", serial_number: "BV-SHOW07", nickname: "Manchester unit 2", current_event_id: EVT_TECH_NORTH, zone: null, mission: null, status: "deployed", last_heartbeat: null, firmware_version: "3.1.0" },
    // The third November unit is fully prepared and already sold, so the
    // readiness checklist has a finished example beside the two with gaps.
    { id: MI_SHOW(8), machine_type_id: "a2a2a2a2-a2a2-4a2a-8a2a-a2a2a2a2a2a2", serial_number: "BV-SHOW08", nickname: "Hall A Sponsor Stand", current_event_id: EVT_TECH_NORTH, zone: "Hall A", mission: "sponsor_activation", status: "deployed", last_heartbeat: null, firmware_version: "3.1.0" },
  ],

  // Creative the organizer can attach to a sponsor slot.
  assets: [
    { id: ASSET_SHOW_WRAP, event_id: EVT_TECH_LIVE, name: "Sponsor wrap — Hall 3", description: "Machine wrap artwork supplied by the Hall 3 sponsor.", asset_type: "wrap", required_format: "PDF (CMYK)", file_url: "/catalog/case-studies/costa-matcha/01-machine-hero.png", file_name: "hall3-sponsor-wrap.pdf", file_size: 2280400, version: 1, status: "accepted", review_status: "approved", customer_visible: true, revision_count: 0, created_at: "2026-05-28T09:00:00Z" },
    { id: ASSET_SHOW_SCREEN, event_id: EVT_TECH_LIVE, name: "Sponsor attract screen", description: "Idle-screen loop for sponsored units.", asset_type: "imagery", required_format: "PNG 1080x1920", file_url: "/catalog/case-studies/costa-matcha/02-winner-qr-scan.png", file_name: "sponsor-attract-loop.png", file_size: 640200, version: 1, status: "uploaded", review_status: "pending_review", customer_visible: true, revision_count: 0, created_at: "2026-06-02T09:00:00Z" },
    // November: one sponsor's artwork approved, one still waiting on the
    // reviewer — the two creative states the readiness checklist reports.
    { id: ASSET_NORTH_WRAP, event_id: EVT_TECH_NORTH, name: "Sponsor wrap — Hall A", description: "Machine wrap artwork supplied by the Hall A sponsor.", asset_type: "wrap", required_format: "PDF (CMYK)", file_url: "/catalog/case-studies/costa-matcha/01-machine-hero.png", file_name: "halla-sponsor-wrap.pdf", file_size: 1980400, version: 1, status: "accepted", review_status: "approved", customer_visible: true, revision_count: 0, due_date: "2026-10-16", created_at: "2026-07-02T09:00:00Z" },
    { id: ASSET_NORTH_SCREEN, event_id: EVT_TECH_NORTH, name: "Attract screen — Hall A", description: "Idle-screen loop for the Hall A sponsor unit.", asset_type: "imagery", required_format: "PNG 1080x1920", file_url: "/catalog/case-studies/costa-matcha/02-winner-qr-scan.png", file_name: "halla-attract-loop.png", file_size: 610200, version: 1, status: "uploaded", review_status: "pending_review", customer_visible: true, revision_count: 0, due_date: "2026-10-16", created_at: "2026-07-10T09:00:00Z" },
  ],

  // Show-wide default plus one machine-scoped override, so the fleet config
  // tabs have something to resolve.
  game_configurations: [
    { id: "ae000000-0000-4000-8000-000000000001", event_id: EVT_TECH_LIVE, machine_instance_id: null, game_id: "b3b3b3b3-b3b3-4b3b-8b3b-b3b3b3b3b3b3", prize_mode: "guaranteed", prizes_json: [{ name: "Show tote bag", quantity: 800 }], form_fields_json: [{ label: "Work email", type: "email", required: true }], leaderboard_enabled: false, capture_method: "badge_scan", retention_days: 60, branded_landing: true, status: "submitted", created_at: "2026-05-20T09:00:00Z", updated_at: "2026-06-01T09:00:00Z" },
    { id: "ae000000-0000-4000-8000-000000000002", event_id: EVT_TECH_LIVE, machine_instance_id: MI_SHOW(3), game_id: "b4b4b4b4-b4b4-4b4b-8b4b-b4b4b4b4b4b4", prize_mode: "score_based", prizes_json: [{ name: "Sponsor prize bundle", quantity: 120 }], form_fields_json: [{ label: "Work email", type: "email", required: true }, { label: "Job title", type: "text", required: false }], leaderboard_enabled: true, capture_method: "both", retention_days: 60, branded_landing: true, status: "submitted", created_at: "2026-05-28T09:00:00Z", updated_at: "2026-06-02T09:00:00Z" },
    // November's show-wide default, already through QA — the readiness state an
    // organizer is working towards on the other two units.
    { id: "ae000000-0000-4000-8000-000000000003", event_id: EVT_TECH_NORTH, machine_instance_id: null, game_id: "b3b3b3b3-b3b3-4b3b-8b3b-b3b3b3b3b3b3", prize_mode: "guaranteed", prizes_json: [{ name: "Show tote bag", quantity: 600 }], form_fields_json: [{ label: "Work email", type: "email", required: true }], leaderboard_enabled: false, capture_method: "badge_scan", retention_days: 60, branded_landing: true, status: "tested", created_at: "2026-07-06T09:00:00Z", updated_at: "2026-07-14T09:00:00Z" },
  ],

  // Stock for the November show, so the readiness checklist can report what is
  // loaded rather than guessing.
  product_configurations: [
    { id: "9d000001-0000-4000-8000-000000000009", event_id: EVT_TECH_NORTH, machine_instance_id: null, products_json: [{ name: "Show tote bag", sku: "TL-TOTE", slot: 1, stockRatio: 100 }], total_units: 1800, samples_received_at: null, samples_tested: false, machine_config_json: [], notes: "Split evenly across the three units on arrival.", created_at: "2026-07-06T09:00:00Z", updated_at: "2026-07-14T09:00:00Z" },
  ],

  studio_pricing: [
    { id: "e8000000-0000-4000-8000-000000000001", service_type: "design", tier_name: "Essential Enhancements", description: "Meets minimum asset standards", price_gbp: 32.0, price_label: "$32", price_unit: "Per Asset", features: ["Aspect Ratio Correction", "Size Compression", "Background Removal", "Colour Matching"], turnaround_days: 3, revisions_included: 1, is_express: false, is_featured: false, sort_order: 1, created_at: "2026-01-05T09:00:00Z" },
    { id: "e8000000-0000-4000-8000-000000000002", service_type: "design", tier_name: "Professional Enhancements", description: "Transforms assets with expert detail", price_gbp: 72.0, price_label: "$72", price_unit: "Per Asset", features: ["All in Essential", "Quality Boost", "Layout Adjustments", "Web Asset Sourcing", "Web Asset Adaptation"], turnaround_days: 5, revisions_included: 2, is_express: false, is_featured: true, sort_order: 2, created_at: "2026-01-05T09:00:00Z" },
    { id: "e8000000-0000-4000-8000-000000000003", service_type: "design", tier_name: "New Asset Creation", description: "Original assets from the ground up", price_gbp: 120.0, price_label: "$120", price_unit: "Per Asset", features: ["All in Professional", "Concept Development", "Custom Graphics", "Brand Alignment", "Original Layouts", "Multi-Format Delivery"], turnaround_days: 8, revisions_included: 3, is_express: false, is_featured: false, sort_order: 3, created_at: "2026-01-05T09:00:00Z" },
    { id: "e8000000-0000-4000-8000-000000000004", service_type: "animation", tier_name: "Essential Enhancements", description: "Meets minimum motion standards", price_gbp: 160.0, price_label: "$160", price_unit: "Per Asset", features: ["Format Conversion", "Duration Trimming", "Resolution Adjustment", "Basic Colour Correction"], turnaround_days: 4, revisions_included: 1, is_express: false, is_featured: false, sort_order: 1, created_at: "2026-01-05T09:00:00Z" },
    { id: "e8000000-0000-4000-8000-000000000005", service_type: "animation", tier_name: "Professional Enhancements", description: "Elevates existing motion assets", price_gbp: 480.0, price_label: "$480", price_unit: "Per Asset", features: ["All in Essential", "Transition Effects", "Audio Sync", "Text Overlay", "Branded Elements"], turnaround_days: 7, revisions_included: 2, is_express: false, is_featured: true, sort_order: 2, created_at: "2026-01-05T09:00:00Z" },
    { id: "e8000000-0000-4000-8000-000000000006", service_type: "animation", tier_name: "New Asset Creation", description: "Original motion from the ground up", price_gbp: 1080.0, price_label: "$1,080", price_unit: "Per Asset", features: ["All in Professional", "Concept Development", "Custom Animation", "Brand Alignment", "Original Sequences", "Multi-Format Delivery"], turnaround_days: 12, revisions_included: 3, is_express: false, is_featured: false, sort_order: 3, created_at: "2026-01-05T09:00:00Z" },
  ],

  placements: [
    { id: PL_MANCHESTER_SUMMER, venue_id: VENUE_MANCHESTER, machine_instance_id: MI_PRO1, start_date: "2026-07-01", end_date: "2026-07-31", status: "active", pricing_model_json: { model: "revenue_share", rate: 0.15, floor_gbp: 4000 }, notes: "Ground-floor atrium, peak summer footfall.", created_at: "2026-05-20T09:00:00Z", updated_at: "2026-06-18T09:00:00Z" },
    // ── ExCeL London Central Boulevard estate — 10 permanently-sited units,
    // each sold as bookable ad space (sponsorship slots) against show footfall.
    { id: PL_EXCEL(1), venue_id: VENUE_EXCEL, machine_instance_id: MI_EXCEL(1), start_date: "2026-05-01", end_date: "2026-12-31", status: "active", pricing_model_json: { model: "media_rate", weekly_usd: 30000, format: "XL · 65\" landscape" }, notes: "West Entrance — first unit seen on arrival from the West ticket hall. Highest dwell on the Boulevard.", created_at: "2026-04-20T09:00:00Z", updated_at: "2026-06-18T09:00:00Z" },
    { id: PL_EXCEL(2), venue_id: VENUE_EXCEL, machine_instance_id: MI_EXCEL(2), start_date: "2026-05-01", end_date: "2026-12-31", status: "active", pricing_model_json: { model: "media_rate", weekly_usd: 14000, format: "55\" portrait" }, notes: "N1–N4 atrium — feeds the north halls' main entrances.", created_at: "2026-04-20T09:00:00Z", updated_at: "2026-06-18T09:00:00Z" },
    { id: PL_EXCEL(3), venue_id: VENUE_EXCEL, machine_instance_id: MI_EXCEL(3), start_date: "2026-05-01", end_date: "2026-12-31", status: "active", pricing_model_json: { model: "media_rate", weekly_usd: 12000, format: "55\" portrait" }, notes: "Central Café — long dwell beside the Boulevard seating and coffee.", created_at: "2026-04-20T09:00:00Z", updated_at: "2026-06-18T09:00:00Z" },
    { id: PL_EXCEL(4), venue_id: VENUE_EXCEL, machine_instance_id: MI_EXCEL(4), start_date: "2026-05-01", end_date: "2026-12-31", status: "active", pricing_model_json: { model: "media_rate", weekly_usd: 14000, format: "55\" portrait" }, notes: "N5–N8 atrium — north halls midway, peak between-session traffic.", created_at: "2026-04-20T09:00:00Z", updated_at: "2026-06-18T09:00:00Z" },
    { id: PL_EXCEL(5), venue_id: VENUE_EXCEL, machine_instance_id: MI_EXCEL(5), start_date: "2026-05-01", end_date: "2026-12-31", status: "active", pricing_model_json: { model: "media_rate", weekly_usd: 13000, format: "55\" portrait" }, notes: "Capital Hall link — junction to the auditorium and keynote space.", created_at: "2026-04-20T09:00:00Z", updated_at: "2026-06-18T09:00:00Z" },
    { id: PL_EXCEL(6), venue_id: VENUE_EXCEL, machine_instance_id: MI_EXCEL(6), start_date: "2026-05-01", end_date: "2026-12-31", status: "active", pricing_model_json: { model: "media_rate", weekly_usd: 28000, format: "XL · 65\" landscape" }, notes: "East Entrance — first unit seen on arrival from Prince Regent DLR / East hall.", created_at: "2026-04-20T09:00:00Z", updated_at: "2026-06-18T09:00:00Z" },
    { id: PL_EXCEL(7), venue_id: VENUE_EXCEL, machine_instance_id: MI_EXCEL(7), start_date: "2026-05-01", end_date: "2026-12-31", status: "active", pricing_model_json: { model: "media_rate", weekly_usd: 13000, format: "55\" portrait" }, notes: "S1–S4 atrium — south halls' main entrances.", created_at: "2026-04-20T09:00:00Z", updated_at: "2026-06-18T09:00:00Z" },
    { id: PL_EXCEL(8), venue_id: VENUE_EXCEL, machine_instance_id: MI_EXCEL(8), start_date: "2026-05-01", end_date: "2026-12-31", status: "active", pricing_model_json: { model: "media_rate", weekly_usd: 12000, format: "55\" portrait" }, notes: "S5–S8 atrium — south halls midway.", created_at: "2026-04-20T09:00:00Z", updated_at: "2026-06-18T09:00:00Z" },
    { id: PL_EXCEL(9), venue_id: VENUE_EXCEL, machine_instance_id: MI_EXCEL(9), start_date: "2026-05-01", end_date: "2026-12-31", status: "active", pricing_model_json: { model: "media_rate", weekly_usd: 11000, format: "55\" portrait" }, notes: "Aloft Skyline bridge — captures hotel and skyline-bridge crossover traffic.", created_at: "2026-04-20T09:00:00Z", updated_at: "2026-06-18T09:00:00Z" },
    { id: PL_EXCEL(10), venue_id: VENUE_EXCEL, machine_instance_id: MI_EXCEL(10), start_date: "2026-05-01", end_date: "2026-12-31", status: "active", pricing_model_json: { model: "media_rate", weekly_usd: 10000, format: "55\" portrait" }, notes: "Prince Regent DLR approach — last touchpoint before the station exit.", created_at: "2026-04-20T09:00:00Z", updated_at: "2026-06-18T09:00:00Z" },
    { id: PL_MANCHESTER_SPRING, venue_id: VENUE_MANCHESTER, machine_instance_id: MI_PRO2, start_date: "2026-03-01", end_date: "2026-03-31", status: "completed", pricing_model_json: { model: "revenue_share", rate: 0.12 }, notes: "Spring pilot — converted to a recurring slot.", created_at: "2026-02-10T10:00:00Z", updated_at: "2026-04-02T10:00:00Z" },
    { id: PL_WESTFIELD_SUMMER, venue_id: VENUE_WESTFIELD, machine_instance_id: null, start_date: "2026-08-01", end_date: "2026-08-31", status: "active", pricing_model_json: { model: "revenue_share", rate: 0.18, floor_usd: 6000 }, notes: "The Street, ground floor — flagship summer footfall.", created_at: "2026-06-05T09:00:00Z", updated_at: "2026-06-18T09:00:00Z" },
    { id: PL_NEC_AUTUMN, venue_id: VENUE_NEC, machine_instance_id: null, start_date: "2026-10-10", end_date: "2026-10-25", status: "planned", pricing_model_json: { model: "fixed_fee", fee_usd: 22000 }, notes: "Hall 5 concourse, tied to autumn trade-show season.", created_at: "2026-06-12T11:00:00Z", updated_at: "2026-06-12T11:00:00Z" },
  ],

  sponsorship_slots: [
    { id: "b2000000-0000-4000-8000-000000000001", placement_id: PL_MANCHESTER_SUMMER, sponsor_account_id: P_JAMES, start_date: "2026-07-05", end_date: "2026-07-12", price: 2600000, status: "reserved", creative_asset_ids: [], game_config_json: { game: "Spin & Reveal", prize_pool: "Summer minis" }, created_at: "2026-05-22T09:00:00Z", updated_at: "2026-06-10T09:00:00Z" },
    { id: "b2000000-0000-4000-8000-000000000002", placement_id: PL_MANCHESTER_SUMMER, sponsor_account_id: null, start_date: "2026-07-15", end_date: "2026-07-22", price: 2200000, status: "available", creative_asset_ids: [], game_config_json: {}, created_at: "2026-05-22T09:00:00Z", updated_at: "2026-05-22T09:00:00Z" },
    // ── ExCeL ad slots: each Boulevard unit sells campaign windows aligned to
    // the shows running in the halls. "Summer Tech Week" (15–21 Jun) is live
    // now; "MCM Comic Con" (22–26 Oct) is the next major sell-in. Reserved =
    // a sponsor/advertiser is booked; available = still on the table.
    // Summer Tech Week — 15–21 Jun 2026 (live)
    { id: "b2000000-0000-4000-8000-000000000101", placement_id: PL_EXCEL(1), sponsor_account_id: ACC_TECHSHOW, start_date: "2026-06-15", end_date: "2026-06-21", price: 3000000, status: "reserved", creative_asset_ids: [], game_config_json: { campaign: "Tech Show London — register & win", prize_pool: "VIP keynote passes" }, created_at: "2026-04-22T09:00:00Z", updated_at: "2026-06-02T09:00:00Z" },
    { id: "b2000000-0000-4000-8000-000000000102", placement_id: PL_EXCEL(2), sponsor_account_id: ACC_VITALITY, start_date: "2026-06-15", end_date: "2026-06-21", price: 1400000, status: "reserved", creative_asset_ids: [], game_config_json: { campaign: "Vitality — spin for rewards", prize_pool: "Wearables" }, created_at: "2026-04-22T09:00:00Z", updated_at: "2026-06-02T09:00:00Z" },
    { id: "b2000000-0000-4000-8000-000000000103", placement_id: PL_EXCEL(3), sponsor_account_id: ACC_MONSTER, start_date: "2026-06-15", end_date: "2026-06-21", price: 1200000, status: "reserved", creative_asset_ids: [], game_config_json: { campaign: "Monster Energy — sample drop", prize_pool: "Cans + merch" }, created_at: "2026-04-22T09:00:00Z", updated_at: "2026-06-02T09:00:00Z" },
    { id: "b2000000-0000-4000-8000-000000000104", placement_id: PL_EXCEL(4), sponsor_account_id: ACC_EE, start_date: "2026-06-15", end_date: "2026-06-21", price: 1400000, status: "reserved", creative_asset_ids: [], game_config_json: { campaign: "EE — 5G quiz", prize_pool: "Devices" }, created_at: "2026-04-22T09:00:00Z", updated_at: "2026-06-02T09:00:00Z" },
    { id: "b2000000-0000-4000-8000-000000000105", placement_id: PL_EXCEL(5), sponsor_account_id: null, start_date: "2026-06-15", end_date: "2026-06-21", price: 1300000, status: "available", creative_asset_ids: [], game_config_json: {}, created_at: "2026-04-22T09:00:00Z", updated_at: "2026-04-22T09:00:00Z" },
    { id: "b2000000-0000-4000-8000-000000000106", placement_id: PL_EXCEL(6), sponsor_account_id: ACC_COKE, start_date: "2026-06-15", end_date: "2026-06-21", price: 2800000, status: "reserved", creative_asset_ids: [], game_config_json: { campaign: "Coca-Cola — chill & win", prize_pool: "Ice-cold minis" }, created_at: "2026-04-22T09:00:00Z", updated_at: "2026-06-02T09:00:00Z" },
    { id: "b2000000-0000-4000-8000-000000000107", placement_id: PL_EXCEL(7), sponsor_account_id: ACC_DAZN, start_date: "2026-06-15", end_date: "2026-06-21", price: 1300000, status: "reserved", creative_asset_ids: [], game_config_json: { campaign: "DAZN — predict & win", prize_pool: "Subscriptions" }, created_at: "2026-04-22T09:00:00Z", updated_at: "2026-06-02T09:00:00Z" },
    { id: "b2000000-0000-4000-8000-000000000108", placement_id: PL_EXCEL(8), sponsor_account_id: null, start_date: "2026-06-15", end_date: "2026-06-21", price: 1200000, status: "available", creative_asset_ids: [], game_config_json: {}, created_at: "2026-04-22T09:00:00Z", updated_at: "2026-04-22T09:00:00Z" },
    { id: "b2000000-0000-4000-8000-000000000109", placement_id: PL_EXCEL(9), sponsor_account_id: ACC_DIAGEO, start_date: "2026-06-15", end_date: "2026-06-21", price: 1100000, status: "reserved", creative_asset_ids: [], game_config_json: { campaign: "Diageo — over-18 tasting pass", prize_pool: "Tasting vouchers" }, created_at: "2026-04-22T09:00:00Z", updated_at: "2026-06-02T09:00:00Z" },
    { id: "b2000000-0000-4000-8000-000000000110", placement_id: PL_EXCEL(10), sponsor_account_id: null, start_date: "2026-06-15", end_date: "2026-06-21", price: 1000000, status: "available", creative_asset_ids: [], game_config_json: {}, created_at: "2026-04-22T09:00:00Z", updated_at: "2026-04-22T09:00:00Z" },
    // MCM Comic Con — 22–26 Oct 2026 (sell-in)
    { id: "b2000000-0000-4000-8000-000000000111", placement_id: PL_EXCEL(1), sponsor_account_id: ACC_SAMSUNG, start_date: "2026-10-22", end_date: "2026-10-26", price: 3000000, status: "reserved", creative_asset_ids: [], game_config_json: { campaign: "Samsung — Galaxy photo booth", prize_pool: "Galaxy accessories" }, created_at: "2026-06-10T09:00:00Z", updated_at: "2026-06-14T09:00:00Z" },
    { id: "b2000000-0000-4000-8000-000000000112", placement_id: PL_EXCEL(2), sponsor_account_id: null, start_date: "2026-10-22", end_date: "2026-10-26", price: 1400000, status: "available", creative_asset_ids: [], game_config_json: {}, created_at: "2026-06-10T09:00:00Z", updated_at: "2026-06-10T09:00:00Z" },
    { id: "b2000000-0000-4000-8000-000000000113", placement_id: PL_EXCEL(3), sponsor_account_id: ACC_MONSTER, start_date: "2026-10-22", end_date: "2026-10-26", price: 1200000, status: "reserved", creative_asset_ids: [], game_config_json: { campaign: "Monster Energy — cosplay sample drop", prize_pool: "Cans + merch" }, created_at: "2026-06-10T09:00:00Z", updated_at: "2026-06-14T09:00:00Z" },
    { id: "b2000000-0000-4000-8000-000000000114", placement_id: PL_EXCEL(4), sponsor_account_id: null, start_date: "2026-10-22", end_date: "2026-10-26", price: 1400000, status: "available", creative_asset_ids: [], game_config_json: {}, created_at: "2026-06-10T09:00:00Z", updated_at: "2026-06-10T09:00:00Z" },
    { id: "b2000000-0000-4000-8000-000000000115", placement_id: PL_EXCEL(5), sponsor_account_id: ACC_VITALITY, start_date: "2026-10-22", end_date: "2026-10-26", price: 1300000, status: "reserved", creative_asset_ids: [], game_config_json: { campaign: "Vitality — step challenge", prize_pool: "Wearables" }, created_at: "2026-06-10T09:00:00Z", updated_at: "2026-06-14T09:00:00Z" },
    { id: "b2000000-0000-4000-8000-000000000116", placement_id: PL_EXCEL(6), sponsor_account_id: ACC_COMICCON, start_date: "2026-10-22", end_date: "2026-10-26", price: 2800000, status: "reserved", creative_asset_ids: [], game_config_json: { campaign: "MCM Comic Con — main-stage giveaway", prize_pool: "Show merch + passes" }, created_at: "2026-06-10T09:00:00Z", updated_at: "2026-06-14T09:00:00Z" },
    { id: "b2000000-0000-4000-8000-000000000117", placement_id: PL_EXCEL(7), sponsor_account_id: null, start_date: "2026-10-22", end_date: "2026-10-26", price: 1300000, status: "available", creative_asset_ids: [], game_config_json: {}, created_at: "2026-06-10T09:00:00Z", updated_at: "2026-06-10T09:00:00Z" },
    { id: "b2000000-0000-4000-8000-000000000118", placement_id: PL_EXCEL(8), sponsor_account_id: ACC_DAZN, start_date: "2026-10-22", end_date: "2026-10-26", price: 1200000, status: "reserved", creative_asset_ids: [], game_config_json: { campaign: "DAZN — fight-night predictor", prize_pool: "Subscriptions" }, created_at: "2026-06-10T09:00:00Z", updated_at: "2026-06-14T09:00:00Z" },
    { id: "b2000000-0000-4000-8000-000000000119", placement_id: PL_EXCEL(9), sponsor_account_id: null, start_date: "2026-10-22", end_date: "2026-10-26", price: 1100000, status: "available", creative_asset_ids: [], game_config_json: {}, created_at: "2026-06-10T09:00:00Z", updated_at: "2026-06-10T09:00:00Z" },
    { id: "b2000000-0000-4000-8000-000000000120", placement_id: PL_EXCEL(10), sponsor_account_id: ACC_EE, start_date: "2026-10-22", end_date: "2026-10-26", price: 1400000, status: "reserved", creative_asset_ids: [], game_config_json: { campaign: "EE — network speed run", prize_pool: "Devices" }, created_at: "2026-06-10T09:00:00Z", updated_at: "2026-06-14T09:00:00Z" },
    { id: "b2000000-0000-4000-8000-000000000004", placement_id: PL_WESTFIELD_SUMMER, sponsor_account_id: ACC_SAMSUNG, start_date: "2026-08-03", end_date: "2026-08-10", price: 4200000, status: "reserved", creative_asset_ids: [], game_config_json: { game: "Photo Booth Pro", prize_pool: "Galaxy accessories" }, created_at: "2026-06-08T09:00:00Z", updated_at: "2026-06-15T09:00:00Z" },
    { id: "b2000000-0000-4000-8000-000000000005", placement_id: PL_WESTFIELD_SUMMER, sponsor_account_id: null, start_date: "2026-08-12", end_date: "2026-08-19", price: 3600000, status: "available", creative_asset_ids: [], game_config_json: {}, created_at: "2026-06-08T09:00:00Z", updated_at: "2026-06-08T09:00:00Z" },
    { id: "b2000000-0000-4000-8000-000000000006", placement_id: PL_NEC_AUTUMN, sponsor_account_id: null, start_date: "2026-10-12", end_date: "2026-10-18", price: 5000000, status: "available", creative_asset_ids: [], game_config_json: {}, created_at: "2026-06-12T11:05:00Z", updated_at: "2026-06-12T11:05:00Z" },
    // ── Tech Live London: inventory scoped to the show's own machines rather
    // than a venue placement. One sold with a live pitch link, one sold with
    // creative attached, one still open.
    { id: SLOT_SHOW(1), placement_id: null, event_id: EVT_TECH_LIVE, machine_instance_id: MI_SHOW(3), sponsor_account_id: null, sponsor_name: "Vitality", start_date: "2026-06-17", end_date: "2026-06-19", price: 1800000, wholesale_price: 1350000, status: "active", creative_asset_ids: [ASSET_SHOW_WRAP], game_config_json: {}, pitch_token: "9f2c41e8-77b4-4a1d-9d0e-3c6b21af5510", pitch_token_expires_at: "2026-07-18T09:00:00Z", pitch_view_count: 6, pitch_last_viewed_at: "2026-06-14T15:20:00Z", created_at: "2026-05-02T09:00:00Z", updated_at: "2026-06-02T09:00:00Z" },
    { id: SLOT_SHOW(2), placement_id: null, event_id: EVT_TECH_LIVE, machine_instance_id: MI_SHOW(4), sponsor_account_id: null, sponsor_name: "EE", start_date: "2026-06-17", end_date: "2026-06-19", price: 1600000, wholesale_price: 1200000, status: "active", creative_asset_ids: [], game_config_json: {}, pitch_token: null, pitch_token_expires_at: null, created_at: "2026-05-02T09:00:00Z", updated_at: "2026-06-02T09:00:00Z" },
    { id: SLOT_SHOW(3), placement_id: null, event_id: EVT_TECH_LIVE, machine_instance_id: MI_SHOW(5), sponsor_account_id: null, sponsor_name: null, start_date: "2026-06-17", end_date: "2026-06-19", price: 1200000, wholesale_price: 900000, status: "available", creative_asset_ids: [], game_config_json: {}, pitch_token: null, pitch_token_expires_at: null, created_at: "2026-05-02T09:00:00Z", updated_at: "2026-05-02T09:00:00Z" },
    // ── Tech Live North: inventory being sold months before the doors open,
    // which is what the pitch page's pre-show sales kit exists for. One
    // held under a countdown with artwork in, one still on the table.
    { id: SLOT_SHOW(4), placement_id: null, event_id: EVT_TECH_NORTH, machine_instance_id: MI_SHOW(8), sponsor_account_id: null, sponsor_name: "Salesforce", start_date: "2026-11-04", end_date: "2026-11-05", price: 1500000, wholesale_price: 1150000, status: "reserved", hold_expires_at: "2026-08-15T09:00:00Z", creative_asset_ids: [ASSET_NORTH_WRAP], game_config_json: {}, pitch_token: "5b7d92a4-13ce-4f60-8a72-6d1e04bc9f83", pitch_token_expires_at: "2026-08-31T09:00:00Z", pitch_view_count: 3, pitch_last_viewed_at: "2026-07-28T11:05:00Z", created_at: "2026-07-02T09:00:00Z", updated_at: "2026-07-14T09:00:00Z" },
    { id: SLOT_SHOW(5), placement_id: null, event_id: EVT_TECH_NORTH, machine_instance_id: MI_SHOW(6), sponsor_account_id: null, sponsor_name: null, start_date: "2026-11-04", end_date: "2026-11-05", price: 1400000, wholesale_price: 1050000, status: "available", creative_asset_ids: [], game_config_json: {}, pitch_token: "c41f6802-9ab5-4d3e-91c7-2f80ae5b7d16", pitch_token_expires_at: "2026-08-31T09:00:00Z", pitch_view_count: 1, pitch_last_viewed_at: "2026-07-20T08:40:00Z", created_at: "2026-07-02T09:00:00Z", updated_at: "2026-07-02T09:00:00Z" },
  ],

  // ── Deal registrations: Informa's claims on sponsor conversations. One
  // waiting on our 24h review, one approved mid-window, one reverse-pushed
  // lead we matched to their show.
  deal_registrations: [
    { id: "d3000000-0000-4000-8000-000000000001", partner_id: PARTNER_INFORMA, event_id: EVT_TECH_NORTH, quote_id: null, sponsor_company: "Duracell", sponsor_contact_name: "Priya Shah", sponsor_contact_email: "priya.shah@duracell.test", estimated_value: 1600000, notes: "Met at Spring Fair — wants the entrance unit for Tech Live North.", status: "pending", exclusivity_expires_at: null, source: "organizer", rejected_reason: null, approved_at: null, created_at: "2026-08-02T14:00:00Z", updated_at: "2026-08-02T14:00:00Z" },
    { id: "d3000000-0000-4000-8000-000000000002", partner_id: PARTNER_INFORMA, event_id: EVT_TECH_NORTH, quote_id: null, sponsor_company: "Gymshark", sponsor_contact_name: "Tom Ellery", sponsor_contact_email: "tom.e@gymshark.test", estimated_value: 1400000, notes: null, status: "approved", exclusivity_expires_at: "2026-08-14T09:00:00Z", source: "organizer", rejected_reason: null, approved_at: "2026-07-31T09:00:00Z", created_at: "2026-07-30T16:00:00Z", updated_at: "2026-07-31T09:00:00Z" },
    { id: "d3000000-0000-4000-8000-000000000003", partner_id: PARTNER_INFORMA, event_id: EVT_TECH_LIVE, quote_id: null, sponsor_company: "Oatly", sponsor_contact_name: "Freja Lindqvist", sponsor_contact_email: "freja@oatly.test", estimated_value: 1100000, notes: "Came to Bright.Blue direct; their audience is at Informa's shows.", status: "approved", exclusivity_expires_at: "2026-08-12T09:00:00Z", source: "reverse", rejected_reason: null, approved_at: "2026-07-29T09:00:00Z", created_at: "2026-07-29T09:00:00Z", updated_at: "2026-07-29T09:00:00Z" },
  ],

  // Today's activity across the show floor. Volumes differ per zone on
  // purpose: registration is busiest, Hall 5 went quiet this morning.
  telemetry_events: [
    { machine_instance_id: MI_SHOW(1), event_id: EVT_TECH_LIVE, event_type: "play_started", payload_json: { session: "t1" }, timestamp: "2026-06-18T09:40:00Z" },
    { machine_instance_id: MI_SHOW(1), event_id: EVT_TECH_LIVE, event_type: "lead_captured", payload_json: { session: "t1", source: "badge_scan" }, timestamp: "2026-06-18T09:41:00Z" },
    { machine_instance_id: MI_SHOW(1), event_id: EVT_TECH_LIVE, event_type: "prize_awarded", payload_json: { session: "t1", prize: "Show tote bag" }, timestamp: "2026-06-18T09:42:00Z" },
    { machine_instance_id: MI_SHOW(1), event_id: EVT_TECH_LIVE, event_type: "play_started", payload_json: { session: "t2" }, timestamp: "2026-06-18T11:15:00Z" },
    { machine_instance_id: MI_SHOW(1), event_id: EVT_TECH_LIVE, event_type: "lead_captured", payload_json: { session: "t2", source: "badge_scan" }, timestamp: "2026-06-18T11:16:00Z" },
    { machine_instance_id: MI_SHOW(2), event_id: EVT_TECH_LIVE, event_type: "play_started", payload_json: { session: "t3" }, timestamp: "2026-06-18T10:05:00Z" },
    { machine_instance_id: MI_SHOW(2), event_id: EVT_TECH_LIVE, event_type: "lead_captured", payload_json: { session: "t3", source: "badge_scan" }, timestamp: "2026-06-18T10:06:00Z" },
    { machine_instance_id: MI_SHOW(2), event_id: EVT_TECH_LIVE, event_type: "capture_duplicate_blocked", payload_json: { match: "badge_id" }, timestamp: "2026-06-18T10:22:00Z" },
    { machine_instance_id: MI_SHOW(3), event_id: EVT_TECH_LIVE, event_type: "play_started", payload_json: { session: "t4" }, timestamp: "2026-06-18T12:30:00Z" },
    { machine_instance_id: MI_SHOW(3), event_id: EVT_TECH_LIVE, event_type: "play_completed", payload_json: { session: "t4", score: 780 }, timestamp: "2026-06-18T12:31:00Z" },
    { machine_instance_id: MI_SHOW(3), event_id: EVT_TECH_LIVE, event_type: "lead_captured", payload_json: { session: "t4", source: "form" }, timestamp: "2026-06-18T12:32:00Z" },
    { machine_instance_id: MI_SHOW(3), event_id: EVT_TECH_LIVE, event_type: "capture_rejected_domain", payload_json: { domain: "gmail.com" }, timestamp: "2026-06-18T12:44:00Z" },
    { machine_instance_id: MI_SHOW(4), event_id: EVT_TECH_LIVE, event_type: "play_started", payload_json: { session: "t5" }, timestamp: "2026-06-18T08:55:00Z" },
    { machine_instance_id: MI_SHOW(5), event_id: EVT_TECH_LIVE, event_type: "play_started", payload_json: { session: "t6" }, timestamp: "2026-06-18T13:20:00Z" },
    { machine_instance_id: MI_SHOW(5), event_id: EVT_TECH_LIVE, event_type: "lead_captured", payload_json: { session: "t6", source: "badge_scan" }, timestamp: "2026-06-18T13:21:00Z" },
  ],

  venue_packages: [
    { id: "b3000000-0000-4000-8000-000000000001", venue_id: VENUE_MANCHESTER, name: "Pop-Up Day Rate", description: "Single-day kiosk slot with footfall reporting.", price: 120000, includes_bright_blue: true, bright_blue_package_id: PKG_VEND_DAY, sort_order: 0, created_at: "2026-02-01T09:00:00Z" },
    { id: "b3000000-0000-4000-8000-000000000002", venue_id: VENUE_MANCHESTER, name: "Weekend Takeover", description: "Fri–Sun atrium placement with branded wrap and a live footfall dashboard.", price: 340000, includes_bright_blue: true, bright_blue_package_id: PKG_VEND_WEEKEND, sort_order: 1, created_at: "2026-02-01T09:00:00Z" },
    { id: "b3000000-0000-4000-8000-000000000003", venue_id: VENUE_EXCEL, name: "Boulevard Show Takeover", description: "All 10 Central Boulevard units for your show week — branded games, prize delivery, and a live footfall dashboard across the venue.", price: 9500000, includes_bright_blue: true, bright_blue_package_id: PKG_PLAY_5DAY, sort_order: 0, created_at: "2026-04-20T09:00:00Z" },
    { id: "b3000000-0000-4000-8000-000000000004", venue_id: VENUE_EXCEL, name: "Entrance Hero Pair", description: "Both XL entrance units (West + East) for one week — the first and last screens every visitor sees.", price: 2800000, includes_bright_blue: true, bright_blue_package_id: PKG_PLAY_5DAY, sort_order: 1, created_at: "2026-04-20T09:00:00Z" },
    { id: "b3000000-0000-4000-8000-000000000009", venue_id: VENUE_EXCEL, name: "Single-Unit Ad Slot", description: "One Boulevard unit for one show week — your creative on the attract screen plus a branded game.", price: 1200000, includes_bright_blue: true, bright_blue_package_id: PKG_VEND_WEEKEND, sort_order: 2, created_at: "2026-04-20T09:00:00Z" },
    { id: "b3000000-0000-4000-8000-000000000005", venue_id: VENUE_WESTFIELD, name: "The Street Flagship Week", description: "Seven-day ground-floor activation on The Street with full creative production.", price: 1450000, includes_bright_blue: true, bright_blue_package_id: PKG_PLAY_5DAY, sort_order: 0, created_at: "2026-06-05T09:00:00Z" },
    { id: "b3000000-0000-4000-8000-000000000006", venue_id: VENUE_WESTFIELD, name: "Weekend Pop-Up", description: "Fri–Sun kiosk slot with footfall reporting.", price: 480000, includes_bright_blue: true, bright_blue_package_id: PKG_VEND_WEEKEND, sort_order: 1, created_at: "2026-06-05T09:00:00Z" },
    { id: "b3000000-0000-4000-8000-000000000007", venue_id: VENUE_NEC, name: "Hall Concourse Activation", description: "Trade-show concourse placement with branded wrap and a live dashboard.", price: 2200000, includes_bright_blue: true, bright_blue_package_id: PKG_PLAY_5DAY, sort_order: 0, created_at: "2026-06-12T11:00:00Z" },
    { id: "b3000000-0000-4000-8000-000000000008", venue_id: VENUE_NEC, name: "Stand Hire Only", description: "Space-only hire for exhibitor-supplied hardware.", price: 650000, includes_bright_blue: false, bright_blue_package_id: null, sort_order: 1, created_at: "2026-06-12T11:00:00Z" },
  ],

  venue_requirements: [
    { id: "b4000000-0000-4000-8000-000000000001", event_id: EVT_SAMSUNG_LAUNCH, requirement_type: "power_spec", description: "32A single-phase supply within 10m of the activation footprint.", document_url: null, is_met: true, notes: "Confirmed with Westfield facilities.", created_at: "2026-05-30T09:00:00Z", updated_at: "2026-06-12T09:00:00Z" },
    { id: "b4000000-0000-4000-8000-000000000002", event_id: EVT_SAMSUNG_LAUNCH, requirement_type: "insurance_minimum", description: "$5M public liability cover, certificate filed 14 days pre-event.", document_url: null, is_met: false, notes: "Awaiting updated certificate from broker.", created_at: "2026-05-30T09:00:00Z", updated_at: "2026-05-30T09:00:00Z" },
    { id: "b4000000-0000-4000-8000-000000000003", event_id: EVT_SAMSUNG_LAUNCH, requirement_type: "loading_access", description: "Loading bay booking + 90-minute build slot before centre opens.", document_url: null, is_met: true, notes: "Slot booked for 06:30.", created_at: "2026-05-30T09:00:00Z", updated_at: "2026-06-05T09:00:00Z" },
    { id: "b4000000-0000-4000-8000-000000000004", event_id: EVT_SAMSUNG_UNPACKED, requirement_type: "exhibitor_manual", description: "Battersea exhibitor manual reviewed and signed off.", document_url: null, is_met: true, notes: null, created_at: "2026-03-15T09:00:00Z", updated_at: "2026-03-18T09:00:00Z" },
  ],

  // Stage-to-stage handover notes, surfaced on the internal timeline so the
  // baton context the system records is actually visible.
  handoff_notes: [
    { id: "af100000-0000-4000-8000-000000000001", event_id: EVT_COKE_SUMMER, from_stage: "kickoff_complete", to_stage: "creative_assets", author_id: P_SARAH, whats_done: "Briefing call complete, brand kit and goals captured.", whats_pending: "Creative to produce wrap + game screens against the brief.", client_notes: "Client keen on bold 2026 red — avoid the older orange-red.", created_at: "2026-06-13T09:30:00Z" },
    { id: "af100000-0000-4000-8000-000000000002", event_id: EVT_COKE_SUMMER, from_stage: "creative_assets", to_stage: "approvals", author_id: P_EMMA, whats_done: "First proofs of wrap and game banner uploaded for review.", whats_pending: "Awaiting customer sign-off; logo safe-area tweak still open.", client_notes: "James is responsive — usually turns approvals around same day.", created_at: "2026-06-16T12:45:00Z" },
  ],

  // Unresolved reviewer pins so the customer's asset view shows the marked-up
  // notes the creative team dropped (the base dataset's only pin is resolved).
  asset_annotations: [
    { id: "ac222222-2222-2222-2222-222222222222", asset_id: ASSET_BANNER, asset_version_id: null, event_id: EVT_COKE_SUMMER, author_id: P_EMMA, x: 50, y: 18, w: 0, h: 0, body: "Lift the logo ~40px so it clears the safe area on the portrait screen.", resolved: false, created_at: "2026-06-16T10:16:00Z" },
    { id: "ac333333-3333-3333-3333-333333333333", asset_id: ASSET_BANNER, asset_version_id: null, event_id: EVT_COKE_SUMMER, author_id: P_EMMA, x: 24, y: 72, w: 0, h: 0, body: "This red reads slightly orange on the cabinet — please match to 2026 brand red (#F40000).", resolved: false, created_at: "2026-06-16T10:17:00Z" },
  ],

  comments: [
    { id: CMT_BANNER, event_id: EVT_COKE_SUMMER, asset_id: ASSET_BANNER, author_id: P_EMMA, body: "Love the energy here. Can we nudge the logo up ~40px so it clears the safe area on the portrait screen?", parent_id: null, asset_version_id: "af111111-1111-1111-1111-111111111111", created_at: "2026-06-16T10:15:00Z" },
    { id: "cc000000-0000-4000-8000-000000000002", event_id: EVT_COKE_SUMMER, asset_id: ASSET_BANNER, author_id: P_JAMES, body: "Good spot — updated version uploaded with the logo lifted and recoloured to the 2026 red.", parent_id: CMT_BANNER, asset_version_id: "af222222-2222-2222-2222-222222222222", created_at: "2026-06-17T08:40:00Z" },
    { id: "cc000000-0000-4000-8000-000000000003", event_id: EVT_COKE_SUMMER, asset_id: ASSET_WRAP, author_id: P_EMMA, body: "Wrap proof looks great. One thing — the bleed on the left panel is 2mm short for the Pro cabinet.", parent_id: null, created_at: "2026-06-15T14:05:00Z" },
    { id: "cc000000-0000-4000-8000-000000000004", event_id: EVT_COKE_SUMMER, asset_id: null, author_id: P_SARAH, body: "Team — client confirmed the on-site contact and final headcount. We're clear to lock logistics.", parent_id: null, created_at: "2026-06-18T09:30:00Z" },
    { id: "cc000000-0000-4000-8000-000000000005", event_id: EVT_SAMSUNG_LAUNCH, author_id: P_SARAH, asset_id: null, body: "Proofs are in the approvals tab for sign-off. Flagging the insurance cert is still outstanding.", parent_id: null, created_at: "2026-06-14T16:20:00Z" },
  ],

  messages: [
    { id: "ab000000-0000-4000-8000-000000000001", event_id: EVT_COKE_SUMMER, sender_id: P_JAMES, body: "Hi team — really excited to get this one moving. When do you need the final artwork by?", attachments: [], is_internal: false, topic: "general", created_at: "2026-06-12T09:10:00Z" },
    { id: "ab000000-0000-4000-8000-000000000002", event_id: EVT_COKE_SUMMER, sender_id: P_SARAH, body: "Welcome aboard! We'll need final approved assets by 1 July to stay ahead of the build. I've added the checklist to your portal.", attachments: [], is_internal: false, topic: "general", created_at: "2026-06-12T09:25:00Z" },
    { id: "ab000000-0000-4000-8000-000000000003", event_id: EVT_COKE_SUMMER, sender_id: P_EMMA, body: "James — left a couple of notes on the game banner. Quick tweak and we're good to approve.", attachments: [], is_internal: false, topic: "creative", created_at: "2026-06-16T10:20:00Z" },
    { id: "ab000000-0000-4000-8000-000000000004", event_id: EVT_COKE_SUMMER, sender_id: P_TOM, body: "Vans booked for the 14th, two on-site crew confirmed. Will share the run sheet once the wrap is signed off.", attachments: [], is_internal: true, topic: "logistics", created_at: "2026-06-17T11:00:00Z" },
    { id: "ab000000-0000-4000-8000-000000000005", event_id: EVT_SAMSUNG_LAUNCH, sender_id: P_SARAH, body: "Proofs uploaded to the approvals tab. We're blocked on the insurance certificate before we can confirm the build slot.", attachments: [], is_internal: false, topic: "compliance", created_at: "2026-06-14T16:25:00Z" },
    { id: "ab000000-0000-4000-8000-000000000006", event_id: EVT_SAMSUNG_LAUNCH, sender_id: P_TOM, body: "Internal: chasing the broker on the $5M cert. Holding the loading bay slot in the meantime.", attachments: [], is_internal: true, topic: "logistics", created_at: "2026-06-15T09:05:00Z" },
  ],

  notifications: [
    { id: "ad000000-0000-4000-8000-000000000001", user_id: P_EMMA, event_id: EVT_COKE_SUMMER, type: "asset_review", title: "Asset awaiting your review", body: "Game Page Banner (Coca-Cola Summer Festival) is ready for creative sign-off.", is_read: false, link: "/admin/asset-reviews", created_at: "2026-06-17T08:45:00Z", kind: "asset_review_requested", priority: "high", entity_type: "asset", entity_id: ASSET_BANNER, action_required: true },
    { id: "ad000000-0000-4000-8000-000000000002", user_id: P_EMMA, event_id: EVT_COKE_SUMMER, type: "asset_review", title: "Revision uploaded", body: "James Chen re-uploaded the Machine Wrap Artwork after your feedback.", is_read: false, link: "/admin/asset-reviews", created_at: "2026-06-16T12:30:00Z", kind: "asset_revision_uploaded", priority: "normal", entity_type: "asset", entity_id: ASSET_WRAP, action_required: true },
    { id: "ad000000-0000-4000-8000-000000000003", user_id: P_EMMA, event_id: EVT_SAMSUNG_LAUNCH, type: "comment", title: "New comment on Samsung Galaxy Launch", body: "Tim Pedro mentioned the outstanding insurance certificate.", is_read: true, link: "/events/" + EVT_SAMSUNG_LAUNCH, created_at: "2026-06-14T16:30:00Z", kind: "comment_added", priority: "normal", entity_type: "event", entity_id: EVT_SAMSUNG_LAUNCH, action_required: false },
    { id: "ad000000-0000-4000-8000-000000000004", user_id: P_SARAH, event_id: EVT_SAMSUNG_LAUNCH, type: "compliance", title: "Compliance item overdue", body: "Insurance certificate for Samsung Galaxy Launch is still outstanding.", is_read: false, link: "/events/" + EVT_SAMSUNG_LAUNCH, created_at: "2026-06-15T08:00:00Z", kind: "compliance_overdue", priority: "high", entity_type: "event", entity_id: EVT_SAMSUNG_LAUNCH, action_required: true },
    { id: "ad000000-0000-4000-8000-000000000005", user_id: P_SARAH, event_id: EVT_COKE_SUMMER, type: "message", title: "New message from James Chen", body: "Question about the final artwork deadline.", is_read: true, link: "/events/" + EVT_COKE_SUMMER, created_at: "2026-06-12T09:11:00Z", kind: "message_received", priority: "normal", entity_type: "event", entity_id: EVT_COKE_SUMMER, action_required: false },
    { id: "ad000000-0000-4000-8000-000000000006", user_id: P_JAMES, event_id: EVT_COKE_SUMMER, type: "task", title: "Action needed: confirm prize details", body: "Confirm prize details and quantities to keep your Summer Festival on track.", is_read: false, link: "/events/" + EVT_COKE_SUMMER, created_at: "2026-06-16T07:00:00Z", kind: "task_assigned", priority: "high", entity_type: "event", entity_id: EVT_COKE_SUMMER, action_required: true },
    // An approval request IS actionable — it belongs in "Over to you", not
    // the informational "Recent activity" feed (R1 split).
    { id: "ad000000-0000-4000-8000-000000000007", user_id: P_JAMES, event_id: EVT_COKE_SUMMER, type: "approval", title: "Creative ready to approve", body: "Your Idle Screen Advert proof is ready for sign-off.", is_read: true, link: "/events/" + EVT_COKE_SUMMER + "/approvals", created_at: "2026-06-13T15:00:00Z", kind: "approval_requested", priority: "normal", entity_type: "event", entity_id: EVT_COKE_SUMMER, action_required: true },
    // Informational rows for the customer's "Recent activity" feed — things
    // that happened without needing James.
    { id: "ad000000-0000-4000-8000-000000000009", user_id: P_JAMES, event_id: EVT_COKE_SUMMER, type: "stage", title: "Your game build has started", body: "The creative team picked up the Summer Festival build this morning.", is_read: true, link: "/events/" + EVT_COKE_SUMMER, created_at: "2026-06-16T09:20:00Z", kind: "stage_advanced", priority: "normal", entity_type: "event", entity_id: EVT_COKE_SUMMER, action_required: false },
    { id: "ad000000-0000-4000-8000-00000000000a", user_id: P_JAMES, event_id: EVT_COKE_SUMMER, type: "team", title: "Sarah Mitchell joined your event team", body: "Sarah is your operations lead for the Summer Festival.", is_read: true, link: "/events/" + EVT_COKE_SUMMER, created_at: "2026-06-15T10:00:00Z", kind: "team_member_added", priority: "low", entity_type: "event", entity_id: EVT_COKE_SUMMER, action_required: false },
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
    { id: CMP_COKE, account_id: ACC_COKE, name: "Coca-Cola 2026 Experiential Tour", description: "Year-long sampling and activation programme across UK festivals and markets.", status: "active", start_date: "2026-03-01", end_date: "2026-12-31", shared_creative_json: { theme: "Real Magic Summer", palette: ["#F40009", "#FFFFFF"] }, aggregate_metrics_json: { totalPlays: 2511, totalLeads: 2385, totalPrizes: 2461, totalInteractions: 3264, mediaImpressions: 125550, events: 3 }, created_at: "2026-02-20T10:00:00Z", updated_at: "2026-06-18T09:00:00Z" },
    { id: CMP_SAMSUNG, account_id: ACC_SAMSUNG, name: "Galaxy Launch Series", description: "Product-launch activations tied to the 2026 Galaxy release cadence.", status: "active", start_date: "2026-04-01", end_date: "2026-08-31", shared_creative_json: { theme: "Unfold the Moment" }, aggregate_metrics_json: { totalPlays: 2509, totalLeads: 2384, totalPrizes: 2459, totalInteractions: 3262, mediaImpressions: 125450, events: 2 }, created_at: "2026-03-10T10:00:00Z", updated_at: "2026-06-18T09:00:00Z" },
  ],

  campaign_events: [
    { id: "cb000000-0000-4000-8000-000000000001", campaign_id: CMP_COKE, event_id: EVT_COKE_SUMMER, sort_order: 0, created_at: "2026-03-01T10:00:00Z" },
    { id: "cb000000-0000-4000-8000-000000000002", campaign_id: CMP_COKE, event_id: EVT_COKE_CARNIVAL, sort_order: 1, created_at: "2026-04-01T10:00:00Z" },
    { id: "cb000000-0000-4000-8000-000000000003", campaign_id: CMP_COKE, event_id: EVT_COKE_SPRING, sort_order: 2, created_at: "2026-03-01T10:00:00Z" },
    { id: "cb000000-0000-4000-8000-000000000004", campaign_id: CMP_SAMSUNG, event_id: EVT_SAMSUNG_LAUNCH, sort_order: 0, created_at: "2026-04-01T10:00:00Z" },
    { id: "cb000000-0000-4000-8000-000000000005", campaign_id: CMP_SAMSUNG, event_id: EVT_SAMSUNG_UNPACKED, sort_order: 1, created_at: "2026-04-01T10:00:00Z" },
  ],

  invoices: [
    { id: "ac000000-0000-4000-8000-000000000001", event_id: EVT_COKE_SPRING, account_id: ACC_COKE, invoice_number: "INV-2026-0012", amount: 2850000, currency: "GBP", payment_method: "invoice", po_number: null, issued_at: "2026-03-25T09:00:00Z", due_at: "2026-04-24T09:00:00Z", paid_at: "2026-04-10T14:30:00Z", payment_reference: "ACH-CC-88213", status: "paid", notes: "Spring Sampling Tour — final invoice.", created_by: P_SARAH, created_at: "2026-03-25T09:00:00Z", updated_at: "2026-04-10T14:30:00Z" },
    { id: "ac000000-0000-4000-8000-000000000002", event_id: EVT_SAMSUNG_LAUNCH, account_id: ACC_SAMSUNG, invoice_number: "INV-2026-0021", amount: 4125000, currency: "GBP", payment_method: "po", po_number: "PO-SMSNG-8841", issued_at: "2026-06-05T09:00:00Z", due_at: "2026-07-05T09:00:00Z", paid_at: null, payment_reference: null, status: "issued", notes: "Galaxy Launch — deposit invoice against PO.", created_by: P_SARAH, created_at: "2026-06-05T09:00:00Z", updated_at: "2026-06-05T09:00:00Z" },
    { id: "ac000000-0000-4000-8000-000000000003", event_id: EVT_SAMSUNG_UNPACKED, account_id: ACC_SAMSUNG, invoice_number: "INV-2026-0019", amount: 2750000, currency: "GBP", payment_method: "invoice", po_number: null, issued_at: "2026-04-15T09:00:00Z", due_at: "2026-05-15T09:00:00Z", paid_at: null, payment_reference: null, status: "overdue", notes: "Unpacked Pop-Up — final invoice, payment chased.", created_by: P_SARAH, created_at: "2026-04-15T09:00:00Z", updated_at: "2026-05-16T09:00:00Z" },
    { id: "ac000000-0000-4000-8000-000000000004", event_id: EVT_COKE_SUMMER, account_id: ACC_COKE, invoice_number: "INV-2026-0024", amount: 9500000, currency: "GBP", payment_method: "deposit_plus_invoice", po_number: null, issued_at: null, due_at: null, paid_at: null, payment_reference: null, status: "draft", notes: "Summer Festival — draft pending final scope.", created_by: P_SARAH, created_at: "2026-06-10T09:00:00Z", updated_at: "2026-06-10T09:00:00Z" },
  ],

  // Category-average benchmarks keyed to match the report chart's metric keys
  // (interactions / leads / impressions). Each average sits comfortably below
  // the seeded event totals, so "Your Event" clearly beats "Category Average".
  benchmarks: [
    { event_type: "sampling", location_tier: "tier_1", machine_type: "Bright.Vend Pro", metric_name: "interactions", avg_value: 980, median_value: 960, p25_value: 820, p75_value: 1120, sample_size: 24 },
    { event_type: "sampling", location_tier: "tier_1", machine_type: "Bright.Vend Pro", metric_name: "leads", avg_value: 720, median_value: 705, p25_value: 600, p75_value: 820, sample_size: 24 },
    { event_type: "sampling", location_tier: "tier_1", machine_type: "Bright.Vend Pro", metric_name: "impressions", avg_value: 38000, median_value: 37000, p25_value: 31000, p75_value: 44000, sample_size: 24 },
    { event_type: "activation", location_tier: "tier_1", machine_type: "Bright.Play", metric_name: "interactions", avg_value: 1050, median_value: 1020, p25_value: 880, p75_value: 1200, sample_size: 31 },
    { event_type: "activation", location_tier: "tier_1", machine_type: "Bright.Play", metric_name: "leads", avg_value: 770, median_value: 750, p25_value: 640, p75_value: 880, sample_size: 31 },
    { event_type: "activation", location_tier: "tier_1", machine_type: "Bright.Play", metric_name: "impressions", avg_value: 40000, median_value: 39000, p25_value: 33000, p75_value: 46000, sample_size: 31 },
  ],
};
