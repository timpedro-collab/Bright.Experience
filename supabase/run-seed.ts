import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { generateLeads } from "../src/lib/metrics/generate-leads";

// Age-band split used to give captured leads realistic, report-aligned ages.
const LEAD_DEMOGRAPHICS = { "18-24": 30, "25-34": 39, "35-44": 19, "45-54": 8, "55+": 4 };

// Load env from .env.local (gitignored) so secrets never live in code.
function loadEnvLocal() {
  try {
    const raw = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
    for (const line of raw.split("\n")) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  } catch {
    /* .env.local is optional in CI */
  }
}
loadEnvLocal();

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL ?? "";
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error(
    "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Add them to .env.local before seeding.",
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

/** ISO date (YYYY-MM-DD) n days from today — keeps demo deadlines in the future. */
function daysFromNow(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

async function seed() {
  // Accounts
  const { error: accErr } = await supabase.from("accounts").upsert([
    { id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa", name: "Coca-Cola UK", slug: "coca-cola-uk" },
    { id: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb", name: "Samsung Electronics", slug: "samsung" },
    { id: "cccccccc-cccc-cccc-cccc-cccccccccccc", name: "Diageo", slug: "diageo" },
  ]);
  if (accErr) { console.error("Accounts:", accErr.message); return; }
  console.log("Accounts seeded");

  // Profiles
  const { error: profErr } = await supabase.from("profiles").upsert([
    { id: "11111111-1111-1111-1111-111111111111", name: "Tim Pedro", email: "tim@brightblue.co.uk", role: "events_lead", account_id: null },
    { id: "22222222-2222-2222-2222-222222222222", name: "James Chen", email: "james.chen@cocacola.com", role: "customer_admin", account_id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa" },
    { id: "33333333-3333-3333-3333-333333333333", name: "Theo Roturu", email: "theo@brightblue.co.uk", role: "creative_lead", account_id: null },
    { id: "44444444-4444-4444-4444-444444444444", name: "Dan Barnes", email: "dan@brightblue.co.uk", role: "operations_lead", account_id: null },
    { id: "55555555-5555-5555-5555-555555555555", name: "Alex Rivera", email: "alex@brightblue.co.uk", role: "qa_lead", account_id: null },
  ]);
  if (profErr) { console.error("Profiles:", profErr.message); return; }
  console.log("Profiles seeded");

  // Events
  const { error: evtErr } = await supabase.from("events").upsert([
    { id: "e1111111-1111-1111-1111-111111111111", account_id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa", name: "Coca-Cola Summer Festival 2026", event_type: "vending", package_type: "premium", machine_type: "Bright.Vend Pro", venue_name: "Hyde Park", venue_address: "London W2 2UH", event_date_start: "2026-07-15", event_date_end: "2026-07-17", setup_date: "2026-07-14", collection_date: "2026-07-18", current_stage: "creative_assets", health_status: "green", created_by: "11111111-1111-1111-1111-111111111111" },
    { id: "e2222222-2222-2222-2222-222222222222", account_id: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb", name: "Samsung Galaxy Launch Experience", event_type: "activation", package_type: "custom", machine_type: "Bright.Play", venue_name: "Westfield London", venue_address: "Ariel Way, London W12 7GF", event_date_start: daysFromNow(38), event_date_end: daysFromNow(40), current_stage: "approvals", health_status: "amber", created_by: "11111111-1111-1111-1111-111111111111" },
    { id: "e3333333-3333-3333-3333-333333333333", account_id: "cccccccc-cccc-cccc-cccc-cccccccccccc", name: "Guinness Six Nations Fan Zone", event_type: "sampling", package_type: "standard", machine_type: "Bright.Vend", venue_name: "Twickenham Stadium", venue_address: "Whitton Rd, Twickenham TW2 7BA", event_date_start: "2026-06-10", current_stage: "kickoff_complete", health_status: "green", created_by: "11111111-1111-1111-1111-111111111111" },
    { id: "e4444444-4444-4444-4444-444444444444", account_id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa", name: "Coca-Cola Notting Hill Carnival", event_type: "vending", package_type: "premium", machine_type: "Bright.Vend Pro", venue_name: "Notting Hill Carnival", venue_address: "Notting Hill, London W11", event_date_start: "2026-08-14", event_date_end: "2026-08-16", current_stage: "confirmed", health_status: "green", created_by: "11111111-1111-1111-1111-111111111111" },
    // Genuinely completed event: its date is in the past AND its stage is
    // `complete`, so "wrapped" is honest. Carries a published report below.
    { id: "e5555555-5555-5555-5555-555555555555", account_id: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb", name: "Samsung Unpacked Pop-Up", event_type: "activation", package_type: "premium", machine_type: "Bright.Play", venue_name: "Battersea Power Station", venue_address: "Circus Rd W, London SW11 8DD", event_date_start: "2026-04-10", event_date_end: "2026-04-12", current_stage: "complete", health_status: "green", created_by: "11111111-1111-1111-1111-111111111111" },
    // Completed Coca-Cola event so the CUSTOMER (James) sees his own finished
    // lifecycle: full telemetry + a published proof-of-performance report.
    { id: "e6666666-6666-6666-6666-666666666666", account_id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa", name: "Coca-Cola Spring Sampling Tour", event_type: "sampling", package_type: "premium", machine_type: "Bright.Vend Pro", venue_name: "Manchester Piccadilly Gardens", venue_address: "Manchester M1 1RG", event_date_start: "2026-03-20", event_date_end: "2026-03-22", current_stage: "complete", health_status: "green", created_by: "11111111-1111-1111-1111-111111111111" },
  ]);
  if (evtErr) { console.error("Events:", evtErr.message); return; }
  console.log("Events seeded");

  // Milestones for evt-1 (clear first so re-runs don't duplicate)
  await supabase.from("milestones").delete().eq("event_id", "e1111111-1111-1111-1111-111111111111");
  const { error: msErr } = await supabase.from("milestones").insert([
    { event_id: "e1111111-1111-1111-1111-111111111111", name: "Event Confirmed", stage: "confirmed", status: "complete", target_date: "2026-05-06", completed_at: "2026-03-01T10:00:00Z", sort_order: 0 },
    { event_id: "e1111111-1111-1111-1111-111111111111", name: "Kickoff Complete", stage: "kickoff_complete", status: "complete", target_date: "2026-05-13", completed_at: "2026-03-15T14:00:00Z", sort_order: 1 },
    { event_id: "e1111111-1111-1111-1111-111111111111", name: "Creative Assets Received", stage: "creative_assets", status: "in_progress", target_date: "2026-06-25", sort_order: 2 },
    { event_id: "e1111111-1111-1111-1111-111111111111", name: "Creative Approved", stage: "approvals", status: "pending", target_date: "2026-07-02", sort_order: 3 },
    { event_id: "e1111111-1111-1111-1111-111111111111", name: "Machine Configured", stage: "build_configuration", status: "pending", target_date: "2026-07-08", sort_order: 4 },
    { event_id: "e1111111-1111-1111-1111-111111111111", name: "QA Complete", stage: "qa_readiness", status: "pending", target_date: "2026-07-11", sort_order: 5 },
    { event_id: "e1111111-1111-1111-1111-111111111111", name: "Logistics Confirmed", stage: "logistics_confirmed", status: "pending", target_date: "2026-07-13", sort_order: 6 },
    { event_id: "e1111111-1111-1111-1111-111111111111", name: "Event Live", stage: "event_live", status: "pending", target_date: "2026-07-15", sort_order: 7 },
    { event_id: "e1111111-1111-1111-1111-111111111111", name: "Reporting Available", stage: "reporting", status: "pending", target_date: "2026-07-18", sort_order: 8 },
    { event_id: "e1111111-1111-1111-1111-111111111111", name: "Event Complete", stage: "complete", status: "pending", target_date: "2026-07-22", sort_order: 9 },
  ]);
  if (msErr) { console.error("Milestones:", msErr.message); return; }
  console.log("Milestones seeded");

  // Tasks for evt-1 (upsert by id so re-runs are idempotent)
  const { error: taskErr } = await supabase.from("tasks").upsert([
    { id: "d1111111-1111-1111-1111-111111111111", event_id: "e1111111-1111-1111-1111-111111111111", title: "Upload primary brand logo", description: "SVG or PNG format, minimum 300dpi, on transparent background", task_type: "customer_action", category: "creative", status: "complete", priority: "high", assigned_to: "22222222-2222-2222-2222-222222222222", due_date: "2026-04-10", completed_at: "2026-04-02T10:00:00Z", is_blocking: true, customer_visible: true, sort_order: 0 },
    { id: "d2222222-2222-2222-2222-222222222222", event_id: "e1111111-1111-1111-1111-111111111111", title: "Add your brand kit (colours, fonts, usage)", description: "Add your brand colours and fonts in a few fields — or attach a full guidelines PDF if you have one", task_type: "customer_action", category: "creative", status: "in_progress", priority: "high", assigned_to: "22222222-2222-2222-2222-222222222222", due_date: daysFromNow(5), is_blocking: true, customer_visible: true, sort_order: 1 },
    { id: "d3333333-3333-3333-3333-333333333333", event_id: "e1111111-1111-1111-1111-111111111111", title: "Provide webform questions", description: "List of data capture questions for the consumer-facing form", task_type: "customer_action", category: "creative", status: "pending", priority: "medium", assigned_to: "22222222-2222-2222-2222-222222222222", due_date: daysFromNow(8), is_blocking: false, customer_visible: true, sort_order: 2 },
    { id: "d4444444-4444-4444-4444-444444444444", event_id: "e1111111-1111-1111-1111-111111111111", title: "Confirm prize details and quantities", description: "Product name, size, quantity, and any vending-specific requirements", task_type: "customer_action", category: "operations", status: "pending", priority: "high", assigned_to: "22222222-2222-2222-2222-222222222222", due_date: daysFromNow(11), is_blocking: true, customer_visible: true, sort_order: 3 },
    { id: "d5555555-5555-5555-5555-555555555555", event_id: "e1111111-1111-1111-1111-111111111111", title: "Provide onsite contact details", description: "Name, phone, and email for the person on site during the event", task_type: "customer_action", category: "logistics", status: "pending", priority: "medium", due_date: daysFromNow(20), is_blocking: false, customer_visible: true, sort_order: 4 },
    { id: "d6666666-6666-6666-6666-666666666666", event_id: "e1111111-1111-1111-1111-111111111111", title: "Design wrap concept", task_type: "internal_action", category: "creative", status: "pending", priority: "high", assigned_to: "33333333-3333-3333-3333-333333333333", due_date: daysFromNow(7), is_blocking: true, customer_visible: false, sort_order: 5 },
    { id: "d7777777-7777-7777-7777-777777777777", event_id: "e1111111-1111-1111-1111-111111111111", title: "Configure game logic", task_type: "internal_action", category: "development", status: "pending", priority: "medium", assigned_to: "55555555-5555-5555-5555-555555555555", due_date: daysFromNow(25), is_blocking: false, customer_visible: false, sort_order: 6 },
    { id: "d8888888-8888-8888-8888-888888888888", event_id: "e1111111-1111-1111-1111-111111111111", title: "Arrange logistics and transport", task_type: "internal_action", category: "logistics", status: "pending", priority: "medium", assigned_to: "44444444-4444-4444-4444-444444444444", due_date: daysFromNow(40), is_blocking: false, customer_visible: false, sort_order: 7 },
  ]);
  if (taskErr) { console.error("Tasks:", taskErr.message); return; }
  console.log("Tasks seeded");

  // Generic tasks for other events (clear first so re-runs don't duplicate)
  const genericEventIds = ["e2222222-2222-2222-2222-222222222222", "e3333333-3333-3333-3333-333333333333", "e4444444-4444-4444-4444-444444444444", "e5555555-5555-5555-5555-555555555555", "e6666666-6666-6666-6666-666666666666"];
  await supabase.from("tasks").delete().in("event_id", genericEventIds);
  const genericTasks = [];
  for (const eid of genericEventIds) {
    genericTasks.push(
      { event_id: eid, title: "Upload brand assets", task_type: "customer_action", category: "creative", status: "pending", priority: "high", due_date: daysFromNow(10), is_blocking: true, customer_visible: true, sort_order: 0 },
      { event_id: eid, title: "Complete creative briefing form", task_type: "customer_action", category: "creative", status: "pending", priority: "medium", due_date: daysFromNow(14), is_blocking: false, customer_visible: true, sort_order: 1 },
    );
  }
  const { error: gtErr } = await supabase.from("tasks").insert(genericTasks);
  if (gtErr) { console.error("Generic tasks:", gtErr.message); return; }
  console.log("Generic tasks seeded");

  // Completed events (Samsung Unpacked e5, Coca-Cola Spring e6) — close out
  // their open work and accept assets so each overview honestly reads
  // "everyone's caught up" rather than showing outstanding items on a wrap.
  const COMPLETED_EVENT_IDS = [
    "e5555555-5555-5555-5555-555555555555",
    "e6666666-6666-6666-6666-666666666666",
  ];
  await supabase
    .from("tasks")
    .update({ status: "complete", completed_at: "2026-04-09T17:00:00Z" })
    .in("event_id", COMPLETED_EVENT_IDS);
  await supabase
    .from("assets")
    .update({ status: "accepted" })
    .in("event_id", COMPLETED_EVENT_IDS);
  console.log("Completed-event work closed out");

  // Hero event (evt-1) assets.
  // The canonical game-flow checklist (ids a1f00000-…) is seeded by seed.sql.
  // Older runs of this script ALSO inserted four legacy rows (Primary Brand
  // Logo / Brand Guidelines / Campaign Hero Image / Product Photography) which
  // duplicated the canonical set and carried overdue April dates. Delete those
  // so the customer sees ONE clean, deduplicated checklist.
  const LEGACY_EVT1_ASSETS = [
    "a1111111-1111-1111-1111-111111111111",
    "a2222222-2222-2222-2222-222222222222",
    "a3333333-3333-3333-3333-333333333333",
    "a4444444-4444-4444-4444-444444444444",
  ];
  await supabase.from("assets").delete().in("id", LEGACY_EVT1_ASSETS);
  // Clear any stray test file accidentally attached to the Payment Terminal slot
  // during earlier manual testing (seed.sql leaves it empty / required).
  await supabase
    .from("assets")
    .update({ status: "required", file_url: null, file_name: null, file_size: null })
    .eq("id", "a1f00000-0000-4000-8000-000000000004");
  console.log("Hero assets de-duplicated");

  // Approvals for evt-2
  const { error: apErr } = await supabase.from("approvals").upsert([
    { id: "ab111111-1111-1111-1111-111111111111", event_id: "e2222222-2222-2222-2222-222222222222", title: "Wrap Design", description: "Machine wrap design for the Galaxy Launch Experience", approval_type: "wrap", status: "pending", preview_url: "/previews/samsung-wrap-v2.png", requested_by: "33333333-3333-3333-3333-333333333333", requested_at: "2026-03-28T14:00:00Z", feedback: "Previous version had incorrect blue shade. Updated to Galaxy Blue #1428A0.", revision_count: 1 },
    { id: "ab222222-2222-2222-2222-222222222222", event_id: "e2222222-2222-2222-2222-222222222222", title: "Game Flow", description: "Interactive game sequence for the Bright.Play activation", approval_type: "game_flow", status: "approved", requested_by: "33333333-3333-3333-3333-333333333333", requested_at: "2026-03-20T10:00:00Z", decided_at: "2026-03-22T16:30:00Z", revision_count: 0 },
    { id: "ab333333-3333-3333-3333-333333333333", event_id: "e2222222-2222-2222-2222-222222222222", title: "Webform Design", description: "Data capture form for lead generation", approval_type: "webform", status: "pending", requested_by: "33333333-3333-3333-3333-333333333333", requested_at: "2026-03-30T09:00:00Z", revision_count: 0 },
  ]);
  if (apErr) { console.error("Approvals:", apErr.message); return; }
  console.log("Approvals seeded");

  // ── Lived-in demo layer ─────────────────────────────────────────────────
  // A reviewed asset with a real revision history + a resolved annotation,
  // plus live telemetry, captured leads, and a generated report so the
  // dashboards, reviewer workspace, and Proof-of-Performance view all have
  // realistic data on first run.

  const EVT1 = "e1111111-1111-1111-1111-111111111111";
  // Completed Coca-Cola event — owns the live telemetry, leads and report so
  // the pre-event hero (EVT1) stays honest (its Live/Reports read "not yet").
  const E6 = "e6666666-6666-6666-6666-666666666666";
  // Canonical "Primary Brand Logo" from the game-flow checklist (seed.sql).
  const ASSET1 = "a1f00000-0000-4000-8000-000000000001";
  const UPLOADER = "22222222-2222-2222-2222-222222222222"; // James (customer)
  const REVIEWER = "33333333-3333-3333-3333-333333333333"; // Emma (creative lead)

  // Bump the live asset row to reflect that it went through two rounds.
  await supabase.from("assets").update({ version: 2 }).eq("id", ASSET1);

  // Two versions: round 1 sent back, round 2 approved.
  const { error: verErr } = await supabase.from("asset_versions").upsert([
    {
      id: "af111111-1111-1111-1111-111111111111",
      asset_id: ASSET1,
      event_id: EVT1,
      version: 1,
      file_path: "uploads/coca-cola-logo-v1.svg",
      file_name: "coca-cola-primary-logo-v1.svg",
      file_size: 44100,
      file_type: "image/svg+xml",
      uploaded_by: UPLOADER,
      review_status: "revision_requested",
      review_feedback: "Logo is sitting on a white box — we need it on a fully transparent background, and the wordmark is slightly pixelated. Please re-export at 300dpi.",
      review_decided_by: REVIEWER,
      review_decided_at: "2026-03-29T11:00:00Z",
    },
    {
      id: "af222222-2222-2222-2222-222222222222",
      asset_id: ASSET1,
      event_id: EVT1,
      version: 2,
      file_path: "uploads/coca-cola-logo.svg",
      file_name: "coca-cola-primary-logo.svg",
      file_size: 45200,
      file_type: "image/svg+xml",
      uploaded_by: UPLOADER,
      review_status: "approved",
      review_feedback: "Perfect — transparent background, crisp wordmark. Approved for wrap and digital.",
      review_decided_by: REVIEWER,
      review_decided_at: "2026-04-02T10:00:00Z",
    },
  ], { onConflict: "asset_id,version" });
  if (verErr) {
    // Depends on the canonical asset rows from seed.sql, so this is the first
    // thing to fail if the seed ran out of order.
    console.warn("Asset versions skipped:", verErr.message);
  } else {
    console.log("Asset versions seeded");
  }

  // A region-anchored note left on round 1, now resolved.
  const { error: annErr } = await supabase.from("asset_annotations").upsert([
    {
      id: "ac111111-1111-1111-1111-111111111111",
      asset_id: ASSET1,
      asset_version_id: "af111111-1111-1111-1111-111111111111",
      event_id: EVT1,
      author_id: REVIEWER,
      x: 32, y: 28, w: 36, h: 18,
      body: "White box visible here — needs a transparent background.",
      resolved: true,
    },
  ]);
  if (annErr) {
    console.warn("Asset annotations skipped:", annErr.message);
  } else {
    console.log("Asset annotations seeded");
  }

  // The hero (EVT1) is pre-event, so it must NOT carry live data. Clear any
  // telemetry/leads/report a prior seed put on it — they now live on E6.
  await supabase.from("event_metrics_snapshot").delete().eq("event_id", EVT1);
  await supabase.from("leads").delete().eq("event_id", EVT1);
  await supabase.from("event_reports").delete().eq("event_id", EVT1);

  // Live telemetry for the completed Coca-Cola event, across its three days.
  const { error: snapErr } = await supabase.from("event_metrics_snapshot").upsert([
    { event_id: E6, snapshot_date: "2026-03-20", total_plays: 1840, total_interactions: 2510, total_leads: 612, total_prizes: 430, avg_dwell_time: 47.5, peak_hour: 14, is_final: false },
    { event_id: E6, snapshot_date: "2026-03-21", total_plays: 2120, total_interactions: 2890, total_leads: 705, total_prizes: 498, avg_dwell_time: 51.2, peak_hour: 15, is_final: false },
    { event_id: E6, snapshot_date: "2026-03-22", total_plays: 1730, total_interactions: 2300, total_leads: 560, total_prizes: 401, avg_dwell_time: 48.0, peak_hour: 13, is_final: true },
  ], { onConflict: "event_id,snapshot_date" });
  if (snapErr) { console.error("Metrics snapshots:", snapErr.message); return; }
  console.log("Metrics snapshots seeded");

  // The customer-visible published post-event report.
  const totalPlays = 5690, totalInteractions = 7700, totalLeads = 1877, totalPrizes = 1329;

  // Captured leads — one row per opted-in contact so the leads list reconciles
  // with the report's headline lead count, each with a report-aligned age.
  const leadRows = generateLeads({
    eventId: E6,
    count: totalLeads,
    startDate: "2026-03-20",
    days: 3,
    demographics: LEAD_DEMOGRAPHICS,
    peakHours: [14, 15, 13],
  });
  // Clear prior demo leads for this event so re-runs don't accumulate.
  await supabase.from("leads").delete().eq("event_id", E6);
  const { error: leadErr } = await supabase.from("leads").insert(leadRows);
  if (leadErr) { console.error("Leads:", leadErr.message); return; }
  console.log("Leads seeded");
  const { error: repErr } = await supabase.from("event_reports").upsert([
    {
      id: "e7666666-6666-6666-6666-666666666666",
      event_id: E6,
      report_type: "post_event",
      title: "Post-Event Report — Coca-Cola Spring Sampling Tour",
      metrics_json: { totalPlays, totalInteractions, totalLeads, totalPrizes, avgDwellTime: 48.9, snapshotCount: 3 },
      predictions_json: { estimatedInteractions: 7000, estimatedLeads: 1700 },
      comparison_json: {
        interactions: { predicted: 7000, actual: totalInteractions, delta: totalInteractions - 7000 },
        leads: { predicted: 1700, actual: totalLeads, delta: totalLeads - 1700 },
      },
      highlights_json: ["Beat the lead target by 10.4%", "Peak engagement at 2pm Saturday"],
      is_published: true,
    },
  ]);
  if (repErr) { console.error("Report:", repErr.message); return; }
  console.log("Report seeded");

  // ── Completed event (e5) telemetry + published report ───────────────────
  // Gives the portfolio a genuine end-to-end example: an event that actually
  // wrapped, with final numbers and a shareable proof-of-performance report.
  const E5 = "e5555555-5555-5555-5555-555555555555";
  await supabase.from("event_metrics_snapshot").upsert([
    { event_id: E5, snapshot_date: "2026-04-10", total_plays: 1620, total_interactions: 2180, total_leads: 540, total_prizes: 372, avg_dwell_time: 44.8, peak_hour: 16, is_final: false },
    { event_id: E5, snapshot_date: "2026-04-11", total_plays: 1980, total_interactions: 2640, total_leads: 631, total_prizes: 455, avg_dwell_time: 49.1, peak_hour: 15, is_final: false },
    { event_id: E5, snapshot_date: "2026-04-12", total_plays: 1450, total_interactions: 1910, total_leads: 489, total_prizes: 340, avg_dwell_time: 46.3, peak_hour: 14, is_final: true },
  ], { onConflict: "event_id,snapshot_date" });

  const e5Plays = 5050, e5Interactions = 6730, e5Leads = 1660, e5Prizes = 1167;
  const { error: rep5Err } = await supabase.from("event_reports").upsert([
    {
      id: "e7555555-5555-5555-5555-555555555555",
      event_id: E5,
      report_type: "post_event",
      title: "Post-Event Report — Samsung Unpacked Pop-Up",
      metrics_json: { totalPlays: e5Plays, totalInteractions: e5Interactions, totalLeads: e5Leads, totalPrizes: e5Prizes, avgDwellTime: 46.7, snapshotCount: 3 },
      predictions_json: { estimatedInteractions: 6000, estimatedLeads: 1500 },
      comparison_json: {
        interactions: { predicted: 6000, actual: e5Interactions, delta: e5Interactions - 6000 },
        leads: { predicted: 1500, actual: e5Leads, delta: e5Leads - 1500 },
      },
      highlights_json: ["Beat the lead target by 10.7%", "Strongest day was launch Saturday"],
      is_published: true,
    },
  ]);
  if (rep5Err) { console.error("Report (e5):", rep5Err.message); return; }
  console.log("Completed-event (e5) report seeded");

  // E5 captured leads — reconcile the leads list with the report's lead count.
  const e5LeadRows = generateLeads({
    eventId: E5,
    count: e5Leads,
    startDate: "2026-04-10",
    days: 3,
    demographics: LEAD_DEMOGRAPHICS,
    peakHours: [16, 15, 14],
  });
  await supabase.from("leads").delete().eq("event_id", E5);
  const { error: lead5Err } = await supabase.from("leads").insert(e5LeadRows);
  if (lead5Err) { console.error("Leads (e5):", lead5Err.message); return; }
  console.log("Completed-event (e5) leads seeded");

  console.log("\nSeed complete!");
}

seed();
