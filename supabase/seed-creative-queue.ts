/**
 * Demo helper — populates the creative-team review queue.
 *
 * Turns a handful of existing "required" asset slots on the two Coca-Cola
 * demo events into *uploaded files awaiting a Bright.Blue creative decision*:
 *   - status        → 'under_review'   (the customer's upload state)
 *   - review_status → 'pending_review' (action is on the creative team)
 *   - file_url / file_name / file_size  (a real, previewable image)
 *   - uploaded_by   → James Chen (the Coca-Cola customer)
 *
 * Result: /admin/asset-reviews (Theo Roturu, creative_lead) shows a healthy
 * queue of "approve or request a revision" items, while the customer's Assets
 * page shows the same slots as "Under review".
 *
 * Idempotent — safe to re-run. Targets whichever Supabase project .env.local
 * points at (service-role key required). Run with:  npx tsx supabase/seed-creative-queue.ts
 */

import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

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
    "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Add them to .env.local first.",
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const JAMES = "22222222-2222-2222-2222-222222222222"; // Coca-Cola customer (uploader)

// Each row: an existing requirement slot that the customer has now "uploaded"
// against, so it lands in the creative team's queue awaiting a decision.
// Previews use real in-repo images so the on-machine preview + markup render.
const UPLOADS: {
  id: string;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  revisionCount: number;
  feedback?: string | null;
}[] = [
  // ── Coca-Cola Summer Festival 2026 (e1) ──────────────────────────────────
  {
    id: "a1f00000-0000-4000-8000-000000000010", // Home Banner Ad
    fileUrl: "/catalog/case-studies/costa-matcha/03-prize-selection.png",
    fileName: "coca-cola-home-banner.png",
    fileSize: 284_500,
    revisionCount: 0,
  },
  {
    id: "a1f00000-0000-4000-8000-000000000009", // Game Page Banner
    fileUrl: "/catalog/case-studies/costa-matcha/01-girl-tapping-screen.png",
    fileName: "coca-cola-game-banner.png",
    fileSize: 198_200,
    revisionCount: 0,
  },
  {
    id: "a1f00000-0000-4000-8000-000000000004", // Payment Terminal Screen
    fileUrl: "/catalog/case-studies/costa-matcha/05-tap-to-start.png",
    fileName: "coca-cola-payment-screen.png",
    fileSize: 132_900,
    // Already sent back once → shows as "revision 2" in the queue.
    revisionCount: 1,
    feedback:
      "First pass had the CTA below the fold — please lift the 'Tap to start' prompt into the top third and increase contrast.",
  },
  {
    id: "a1f00000-0000-4000-8000-000000000005", // Product Packshot
    fileUrl: "/catalog/case-studies/costa-matcha/04-winners-matchilda.png",
    fileName: "coca-cola-packshot.png",
    fileSize: 156_400,
    revisionCount: 0,
  },
  // ── Coca-Cola Christmas Market (e4) ───────────────────────────────────────
  {
    id: "a4f00000-0000-4000-8000-000000000010", // Home Banner Ad
    fileUrl: "/catalog/case-studies/costa-matcha/02-winner-qr-scan.png",
    fileName: "xmas-home-banner.png",
    fileSize: 271_300,
    revisionCount: 0,
  },
  {
    id: "a4f00000-0000-4000-8000-000000000004", // Payment Terminal Screen
    fileUrl: "/catalog/case-studies/costa-matcha/06-full-setup-queue.png",
    fileName: "xmas-payment-screen.png",
    fileSize: 144_700,
    revisionCount: 0,
  },
];

const EMMA = "33333333-3333-3333-3333-333333333333"; // creative lead (reviewer)

async function run() {
  // Reconcile the base-seed "Primary Brand Logo" (e1): its version history is
  // already approved, but the asset row was left at review_status=pending_review
  // with status=accepted, so it lingered (inconsistently) in the queue. Mark it
  // properly approved so the queue only shows genuine awaiting-decision items.
  await supabase
    .from("assets")
    .update({
      review_status: "approved",
      review_decided_by: EMMA,
      review_decided_at: "2026-04-02T10:00:00Z",
    })
    .eq("id", "a1f00000-0000-4000-8000-000000000001");

  let ok = 0;
  for (const u of UPLOADS) {
    const { error } = await supabase
      .from("assets")
      .update({
        status: "under_review",
        review_status: "pending_review",
        review_decided_by: null,
        review_decided_at: null,
        review_feedback: u.feedback ?? null,
        file_url: u.fileUrl,
        file_name: u.fileName,
        file_size: u.fileSize,
        uploaded_by: JAMES,
        revision_count: u.revisionCount,
        customer_visible: true,
      })
      .eq("id", u.id);
    if (error) {
      console.error(`✗ ${u.fileName}:`, error.message);
    } else {
      ok += 1;
      console.log(`✓ ${u.fileName} → pending creative review`);
    }
  }

  const { count } = await supabase
    .from("assets")
    .select("id", { count: "exact", head: true })
    .eq("review_status", "pending_review")
    .not("file_url", "is", null);

  console.log(
    `\nDone. ${ok}/${UPLOADS.length} slots updated. Creative queue now holds ${count ?? "?"} item(s).`,
  );
}

run();
