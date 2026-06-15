import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

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
    { id: "11111111-1111-1111-1111-111111111111", name: "Sarah Mitchell", email: "sarah@brightblue.co.uk", role: "events_lead", account_id: null },
    { id: "22222222-2222-2222-2222-222222222222", name: "James Chen", email: "james.chen@cocacola.com", role: "customer_admin", account_id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa" },
    { id: "33333333-3333-3333-3333-333333333333", name: "Emma Wright", email: "emma@brightblue.co.uk", role: "creative_lead", account_id: null },
    { id: "44444444-4444-4444-4444-444444444444", name: "Tom Parker", email: "tom@brightblue.co.uk", role: "operations_lead", account_id: null },
    { id: "55555555-5555-5555-5555-555555555555", name: "Alex Rivera", email: "alex@brightblue.co.uk", role: "qa_lead", account_id: null },
  ]);
  if (profErr) { console.error("Profiles:", profErr.message); return; }
  console.log("Profiles seeded");

  // Events
  const { error: evtErr } = await supabase.from("events").upsert([
    { id: "e1111111-1111-1111-1111-111111111111", account_id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa", name: "Coca-Cola Summer Festival 2026", event_type: "vending", package_type: "premium", machine_type: "Bright.Vend Pro", venue_name: "Hyde Park", venue_address: "London W2 2UH", event_date_start: "2026-07-15", event_date_end: "2026-07-17", setup_date: "2026-07-14", collection_date: "2026-07-18", current_stage: "creative_assets", health_status: "green", created_by: "11111111-1111-1111-1111-111111111111" },
    { id: "e2222222-2222-2222-2222-222222222222", account_id: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb", name: "Samsung Galaxy Launch Experience", event_type: "activation", package_type: "custom", machine_type: "Bright.Play", venue_name: "Westfield London", venue_address: "Ariel Way, London W12 7GF", event_date_start: "2026-05-20", event_date_end: "2026-05-22", current_stage: "approvals", health_status: "amber", created_by: "11111111-1111-1111-1111-111111111111" },
    { id: "e3333333-3333-3333-3333-333333333333", account_id: "cccccccc-cccc-cccc-cccc-cccccccccccc", name: "Guinness Six Nations Fan Zone", event_type: "sampling", package_type: "standard", machine_type: "Bright.Vend", venue_name: "Twickenham Stadium", venue_address: "Whitton Rd, Twickenham TW2 7BA", event_date_start: "2026-06-10", current_stage: "kickoff_complete", health_status: "green", created_by: "11111111-1111-1111-1111-111111111111" },
    { id: "e4444444-4444-4444-4444-444444444444", account_id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa", name: "Coca-Cola Christmas Market", event_type: "vending", package_type: "premium", machine_type: "Bright.Vend Pro", venue_name: "Birmingham Frankfurt Market", venue_address: "Victoria Square, Birmingham", event_date_start: "2026-11-20", event_date_end: "2026-12-23", current_stage: "confirmed", health_status: "green", created_by: "11111111-1111-1111-1111-111111111111" },
    { id: "e5555555-5555-5555-5555-555555555555", account_id: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb", name: "Samsung Unpacked Pop-Up", event_type: "activation", package_type: "premium", machine_type: "Bright.Play", venue_name: "Battersea Power Station", venue_address: "Circus Rd W, London SW11 8DD", event_date_start: "2026-04-10", event_date_end: "2026-04-12", current_stage: "qa_readiness", health_status: "red", created_by: "11111111-1111-1111-1111-111111111111" },
  ]);
  if (evtErr) { console.error("Events:", evtErr.message); return; }
  console.log("Events seeded");

  // Milestones for evt-1 (clear first so re-runs don't duplicate)
  await supabase.from("milestones").delete().eq("event_id", "e1111111-1111-1111-1111-111111111111");
  const { error: msErr } = await supabase.from("milestones").insert([
    { event_id: "e1111111-1111-1111-1111-111111111111", name: "Event Confirmed", stage: "confirmed", status: "complete", target_date: "2026-05-06", completed_at: "2026-03-01T10:00:00Z", sort_order: 0 },
    { event_id: "e1111111-1111-1111-1111-111111111111", name: "Kickoff Complete", stage: "kickoff_complete", status: "complete", target_date: "2026-05-13", completed_at: "2026-03-15T14:00:00Z", sort_order: 1 },
    { event_id: "e1111111-1111-1111-1111-111111111111", name: "Creative Assets Received", stage: "creative_assets", status: "in_progress", target_date: "2026-05-20", sort_order: 2 },
    { event_id: "e1111111-1111-1111-1111-111111111111", name: "Creative Approved", stage: "approvals", status: "pending", target_date: "2026-05-27", sort_order: 3 },
    { event_id: "e1111111-1111-1111-1111-111111111111", name: "Machine Configured", stage: "build_configuration", status: "pending", target_date: "2026-06-03", sort_order: 4 },
    { event_id: "e1111111-1111-1111-1111-111111111111", name: "QA Complete", stage: "qa_readiness", status: "pending", target_date: "2026-06-10", sort_order: 5 },
    { event_id: "e1111111-1111-1111-1111-111111111111", name: "Logistics Confirmed", stage: "logistics_confirmed", status: "pending", target_date: "2026-06-17", sort_order: 6 },
    { event_id: "e1111111-1111-1111-1111-111111111111", name: "Event Live", stage: "event_live", status: "pending", target_date: "2026-06-24", sort_order: 7 },
    { event_id: "e1111111-1111-1111-1111-111111111111", name: "Reporting Available", stage: "reporting", status: "pending", target_date: "2026-07-01", sort_order: 8 },
    { event_id: "e1111111-1111-1111-1111-111111111111", name: "Event Complete", stage: "complete", status: "pending", target_date: "2026-07-08", sort_order: 9 },
  ]);
  if (msErr) { console.error("Milestones:", msErr.message); return; }
  console.log("Milestones seeded");

  // Tasks for evt-1 (upsert by id so re-runs are idempotent)
  const { error: taskErr } = await supabase.from("tasks").upsert([
    { id: "d1111111-1111-1111-1111-111111111111", event_id: "e1111111-1111-1111-1111-111111111111", title: "Upload primary brand logo", description: "SVG or PNG format, minimum 300dpi, on transparent background", task_type: "customer_action", category: "creative", status: "complete", priority: "high", assigned_to: "22222222-2222-2222-2222-222222222222", due_date: "2026-04-10", completed_at: "2026-04-02T10:00:00Z", is_blocking: true, customer_visible: true, sort_order: 0 },
    { id: "d2222222-2222-2222-2222-222222222222", event_id: "e1111111-1111-1111-1111-111111111111", title: "Upload brand guidelines document", description: "PDF with colour codes, font specifications, and usage rules", task_type: "customer_action", category: "creative", status: "in_progress", priority: "high", assigned_to: "22222222-2222-2222-2222-222222222222", due_date: "2026-04-12", is_blocking: true, customer_visible: true, sort_order: 1 },
    { id: "d3333333-3333-3333-3333-333333333333", event_id: "e1111111-1111-1111-1111-111111111111", title: "Provide webform questions", description: "List of data capture questions for the consumer-facing form", task_type: "customer_action", category: "creative", status: "pending", priority: "medium", assigned_to: "22222222-2222-2222-2222-222222222222", due_date: "2026-04-15", is_blocking: false, customer_visible: true, sort_order: 2 },
    { id: "d4444444-4444-4444-4444-444444444444", event_id: "e1111111-1111-1111-1111-111111111111", title: "Confirm prize details and quantities", description: "Product name, size, quantity, and any vending-specific requirements", task_type: "customer_action", category: "operations", status: "pending", priority: "high", assigned_to: "22222222-2222-2222-2222-222222222222", due_date: "2026-04-18", is_blocking: true, customer_visible: true, sort_order: 3 },
    { id: "d5555555-5555-5555-5555-555555555555", event_id: "e1111111-1111-1111-1111-111111111111", title: "Provide onsite contact details", description: "Name, phone, and email for the person on site during the event", task_type: "customer_action", category: "logistics", status: "pending", priority: "medium", due_date: "2026-05-01", is_blocking: false, customer_visible: true, sort_order: 4 },
    { id: "d6666666-6666-6666-6666-666666666666", event_id: "e1111111-1111-1111-1111-111111111111", title: "Design wrap concept", task_type: "internal_action", category: "creative", status: "pending", priority: "high", assigned_to: "33333333-3333-3333-3333-333333333333", due_date: "2026-04-20", is_blocking: true, customer_visible: false, sort_order: 5 },
    { id: "d7777777-7777-7777-7777-777777777777", event_id: "e1111111-1111-1111-1111-111111111111", title: "Configure game logic", task_type: "internal_action", category: "development", status: "pending", priority: "medium", assigned_to: "55555555-5555-5555-5555-555555555555", due_date: "2026-05-15", is_blocking: false, customer_visible: false, sort_order: 6 },
    { id: "d8888888-8888-8888-8888-888888888888", event_id: "e1111111-1111-1111-1111-111111111111", title: "Arrange logistics and transport", task_type: "internal_action", category: "logistics", status: "pending", priority: "medium", assigned_to: "44444444-4444-4444-4444-444444444444", due_date: "2026-06-30", is_blocking: false, customer_visible: false, sort_order: 7 },
  ]);
  if (taskErr) { console.error("Tasks:", taskErr.message); return; }
  console.log("Tasks seeded");

  // Generic tasks for other events (clear first so re-runs don't duplicate)
  const genericEventIds = ["e2222222-2222-2222-2222-222222222222", "e3333333-3333-3333-3333-333333333333", "e4444444-4444-4444-4444-444444444444", "e5555555-5555-5555-5555-555555555555"];
  await supabase.from("tasks").delete().in("event_id", genericEventIds);
  const genericTasks = [];
  for (const eid of genericEventIds) {
    genericTasks.push(
      { event_id: eid, title: "Upload brand assets", task_type: "customer_action", category: "creative", status: "pending", priority: "high", due_date: "2026-04-20", is_blocking: true, customer_visible: true, sort_order: 0 },
      { event_id: eid, title: "Complete creative briefing form", task_type: "customer_action", category: "creative", status: "pending", priority: "medium", due_date: "2026-04-25", is_blocking: false, customer_visible: true, sort_order: 1 },
    );
  }
  const { error: gtErr } = await supabase.from("tasks").insert(genericTasks);
  if (gtErr) { console.error("Generic tasks:", gtErr.message); return; }
  console.log("Generic tasks seeded");

  // Assets for evt-1
  const { error: assetErr } = await supabase.from("assets").upsert([
    { id: "a1111111-1111-1111-1111-111111111111", event_id: "e1111111-1111-1111-1111-111111111111", name: "Primary Brand Logo", description: "Main logo for wrap and digital touchpoints", asset_type: "logo", required_format: "SVG or PNG (300dpi min)", required_dimensions: "Minimum 2000px wide", file_url: "/uploads/coca-cola-logo.svg", file_name: "coca-cola-primary-logo.svg", file_size: 45200, version: 1, status: "accepted", due_date: "2026-04-10" },
    { id: "a2222222-2222-2222-2222-222222222222", event_id: "e1111111-1111-1111-1111-111111111111", name: "Brand Guidelines", description: "Full brand guide with colour codes, typography, and usage rules", asset_type: "brand_guidelines", required_format: "PDF", version: 1, status: "required", due_date: "2026-04-12" },
    { id: "a3333333-3333-3333-3333-333333333333", event_id: "e1111111-1111-1111-1111-111111111111", name: "Campaign Hero Image", description: "Key visual for the Summer Festival campaign", asset_type: "imagery", required_format: "PNG or JPEG", required_dimensions: "3840x2160 minimum", version: 1, status: "required", due_date: "2026-04-15" },
    { id: "a4444444-4444-4444-4444-444444444444", event_id: "e1111111-1111-1111-1111-111111111111", name: "Product Photography", description: "High-res product shots for digital displays", asset_type: "imagery", required_format: "PNG (transparent background)", required_dimensions: "2000x2000 minimum", version: 1, status: "required", due_date: "2026-04-18" },
  ]);
  if (assetErr) { console.error("Assets:", assetErr.message); return; }
  console.log("Assets seeded");

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
  const ASSET1 = "a1111111-1111-1111-1111-111111111111";
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
    console.warn("Asset versions skipped (table not migrated yet):", verErr.message);
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
    console.warn("Asset annotations skipped (table not migrated yet):", annErr.message);
  } else {
    console.log("Asset annotations seeded");
  }

  // Live telemetry across two days.
  const { error: snapErr } = await supabase.from("event_metrics_snapshot").upsert([
    { event_id: EVT1, snapshot_date: "2026-07-15", total_plays: 1840, total_interactions: 2510, total_leads: 612, total_prizes: 430, avg_dwell_time: 47.5, peak_hour: 14, is_final: false },
    { event_id: EVT1, snapshot_date: "2026-07-16", total_plays: 2120, total_interactions: 2890, total_leads: 705, total_prizes: 498, avg_dwell_time: 51.2, peak_hour: 15, is_final: false },
  ], { onConflict: "event_id,snapshot_date" });
  if (snapErr) { console.error("Metrics snapshots:", snapErr.message); return; }
  console.log("Metrics snapshots seeded");

  // A handful of captured leads.
  const leadRows = [
    { contact_name: "Priya Sharma", contact_email: "priya.sharma@example.com", contact_phone: "+44 7700 900123" },
    { contact_name: "Daniel O'Connor", contact_email: "daniel.oconnor@example.com", contact_phone: "+44 7700 900456" },
    { contact_name: "Mei Lin", contact_email: "mei.lin@example.com", contact_phone: "+44 7700 900789" },
    { contact_name: "Carlos Mendes", contact_email: "carlos.mendes@example.com", contact_phone: "+44 7700 900222" },
    { contact_name: "Sophie Dubois", contact_email: "sophie.dubois@example.com", contact_phone: "+44 7700 900333" },
  ].map((l, i) => ({
    event_id: EVT1,
    ...l,
    source: "game",
    captured_at: `2026-07-1${5 + (i % 2)}T1${i}:30:00Z`,
  }));
  // Clear prior demo leads for this event so re-runs don't accumulate.
  await supabase.from("leads").delete().eq("event_id", EVT1);
  const { error: leadErr } = await supabase.from("leads").insert(leadRows);
  if (leadErr) { console.error("Leads:", leadErr.message); return; }
  console.log("Leads seeded");

  // A generated (unpublished) post-event report.
  const totalPlays = 3960, totalInteractions = 5400, totalLeads = 1317, totalPrizes = 928;
  const { error: repErr } = await supabase.from("event_reports").upsert([
    {
      id: "e7111111-1111-1111-1111-111111111111",
      event_id: EVT1,
      report_type: "post_event",
      title: "Post-Event Report — Coca-Cola Summer Festival 2026",
      metrics_json: { totalPlays, totalInteractions, totalLeads, totalPrizes, avgDwellTime: 49.4, snapshotCount: 2 },
      predictions_json: { estimatedInteractions: 5000, estimatedLeads: 1200 },
      comparison_json: {
        interactions: { predicted: 5000, actual: totalInteractions, delta: totalInteractions - 5000 },
        leads: { predicted: 1200, actual: totalLeads, delta: totalLeads - 1200 },
      },
      highlights_json: ["Beat the lead target by 9.75%", "Peak engagement at 3pm Saturday"],
      is_published: false,
    },
  ]);
  if (repErr) { console.error("Report:", repErr.message); return; }
  console.log("Report seeded");

  console.log("\nSeed complete!");
}

seed();
