/**
 * One-off, idempotent provisioning of the Informa portfolio pricing page
 * against the live Supabase project. The migration
 * 20260818210000_informa_portfolio_pricing_page.sql is the canonical seed;
 * this script exists so the page can go live without waiting on a full
 * migration push.
 *
 * Usage: set -a; source .env.local; set +a; npx tsx scripts/provision-informa-pp.ts
 */
import { createClient } from "@supabase/supabase-js";

import { INFORMA_PP_PAGE } from "../src/lib/informa/deal";

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set"
    );
  }

  const supabase = createClient(url, key, { auth: { persistSession: false } });

  const { data, error } = await supabase
    .from("partner_pricing_pages")
    .upsert(
      {
        slug: INFORMA_PP_PAGE.slug,
        partner_name: INFORMA_PP_PAGE.partnerName,
        show_label: INFORMA_PP_PAGE.showLabel,
        status: "live",
        template: INFORMA_PP_PAGE.template,
        config: INFORMA_PP_PAGE.config,
        hero: INFORMA_PP_PAGE.hero,
      },
      { onConflict: "slug" }
    )
    .select("id, slug, status")
    .single();

  if (error) throw new Error(`Provisioning failed: ${error.message}`);
  console.log(`Live: /pp/${data.slug} (id ${data.id}, status ${data.status})`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
